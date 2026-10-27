/**
 * `vane-file-preview/custom-plugins/EpubPreviewPlugin`
 *
 * EPUB 电子书预览，渲染交给 `react-reader`（内部是 epub.js）。
 *
 * ## 独立子路径，因为它最重
 *
 * `react-reader` + `epubjs` 合起来 200KB+，而且是**唯一**需要 iframe 沙箱渲染
 * 内容的插件（epub.js 把每一章塞进 iframe 注入样式）。所以它不在 `./plugins`
 * 也不在根入口里，只能显式 `import "vane-file-preview/custom-plugins/EpubPreviewPlugin"`
 * —— 不预览电子书的人一个字节都不用付。
 *
 * ## 迁移时改掉的四处
 *
 * 1. **名字**：`SimpleReactReaderEpubPlugin` → `EpubPreviewPlugin`，旧名保留为
 *    别名导出（`createSimpleReactReaderEpubPlugin`）。全库其余 16 个都叫
 *    `<Type>PreviewPlugin`，只有它是 `Simple…`，在路由表里很扎眼。
 *
 * 2. **重复的工具栏**：迁移前正文里自己画了一条 `📚 文件名 / N 章节` 的横条，
 *    上面又有 `renderToolbar` 的文件信息 —— 两条几乎一样的信息叠在一起。
 *    现在只留 `renderToolbar`，正文让给阅读器（它需要尽量多的面积）。
 *
 * 3. **`getPriority` 改成声明式 `priority`。**
 *
 * 4. **加了一层「是不是真 EPUB」的前置校验。** 迁移前直接把 `file.url` 交给
 *    epub.js：URL 404 时服务器常返回一个 HTML 错误页（状态码还是 200），
 *    epub.js 拿到非 zip 字节会抛一个跟「文件」毫无关系的错误，用户看到的是
 *    一片空白。现在自己取字节，先看 zip 魔数（EPUB 就是 zip）**再看 zip 里
 *    有没有 `META-INF/container.xml`**（EPUB 必须有，普通 zip 没有），两道都
 *    过了才交给阅读器；不过就明说是哪一种错。
 *
 * ## 为什么把 ArrayBuffer 直接给阅读器，而不是 blob: URL
 *
 * 第一版用 `URL.createObjectURL(new Blob([buf]))` 转成 `blob:` URL 传进去，
 * 在 happy-dom 单测里「通过」（因为那里根本没真跑 epub.js），真浏览器里却是
 * 阅读器内部一句 `Error loading book`。原因是 epub.js 的
 * `Book.determineType()`：
 *
 * ```js
 * url = new Url(input); ext = url.path().extension;
 * if (!extension) return INPUT_TYPE.DIRECTORY;   // ← 这里
 * if (extension === "epub") return INPUT_TYPE.EPUB;
 * ```
 *
 * 它**只按扩展名猜类型**。`blob:http://host/8f3a-…` 没有扩展名 → 判成
 * `DIRECTORY`（即「已经解压成目录的 epub」）→ 走 `openContainer()`，去请求
 * `META-INF/container.xml` 这个相对路径 —— 相对一个 blob URL 自然 404，
 * `openFailed` 触发。给它 ArrayBuffer 反而最简单：非字符串输入直接走
 * `INPUT_TYPE.BINARY` → `openEpub()` → JSZip 原地解压，一次网络都不发。
 * 顺带还省掉「revokeObjectURL 的时机」这类容易写错的事。
 *
 * ## 已知边界
 *
 * 阅读位置（CFI）不持久化：关掉再打开回到第一页。要持久化得由宿主把
 * `locationChanged` 存下来再通过 `startLocation` 传回来 —— 组件自己写
 * localStorage 是不合适的（同一个 epub 可能被不同用户打开）。
 */

import React, { useEffect, useMemo, useState } from "react";

import { triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import { useDynamicModule } from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

export interface EpubPreviewPluginConfig {
  /** 显示目录（TOC）抽屉。默认 true */
  showToc?: boolean;
  /** 左右滑动翻页（移动端）。默认 false —— 桌面端误触概率高 */
  swipeable?: boolean;
  /** 起始位置 CFI。不传从头开始 */
  startLocation?: string;
}

type ResolvedConfig = Required<Omit<EpubPreviewPluginConfig, "startLocation">> & {
  startLocation?: string;
};

type ReactReaderComponent = React.ComponentType<Record<string, unknown>>;

/** 模块级常量：引用稳定，effect 只跑一次 */
const loadReactReader = () => import("react-reader");

type EpubState =
  | { status: "loading" }
  | { status: "ready"; data: ArrayBuffer; size: number }
  | { status: "error"; error: string };

/** EPUB 是 zip 容器，魔数一定是 `PK\x03\x04`（空归档是 `PK\x05\x06`） */
function looksLikeZip(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  return (
    bytes[0] === 0x50 && // P
    bytes[1] === 0x4b && // K
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  );
}

/**
 * 在原始字节里找一段 ASCII。
 *
 * zip 的 local file header 与中央目录都把**文件名明文**存着（不压缩），
 * 所以不解析 zip 也能判断「这个压缩包里有没有某个条目」。比上一版只看
 * 魔数的好处：普通 zip 也能给出准确错误，而不是让 epub.js 内部去炸。
 *
 * 代价是 O(n·m) 的最坏情况，但只有魔数通过的文件才会走到这里，
 * 而且 200KB 量级上首字节筛一遍就是几十微秒。
 */
function containsAscii(bytes: Uint8Array, needle: string): boolean {
  const first = needle.charCodeAt(0);
  const limit = bytes.length - needle.length;
  outer: for (let i = 0; i <= limit; i++) {
    if (bytes[i] !== first) continue;
    for (let j = 1; j < needle.length; j++) {
      if (bytes[i + j] !== needle.charCodeAt(j)) continue outer;
    }
    return true;
  }
  return false;
}

/** 任何 EPUB 都必须有的容器描述文件；普通 zip 不会有 */
const EPUB_CONTAINER_PATH = "META-INF/container.xml";

function decodeHead(bytes: Uint8Array, length = 80): string {
  return new TextDecoder("utf-8")
    .decode(bytes.subarray(0, 120))
    .replace(/\s+/g, " ")
    .slice(0, length);
}

function EpubBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const deps = useDynamicModule(loadReactReader);
  const [state, setState] = useState<EpubState>({ status: "loading" });
  const [location, setLocation] = useState<string | number>(
    config.startLocation ?? 0
  );
  const [chapters, setChapters] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(context.file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);

        if (!looksLikeZip(bytes)) {
          throw new Error(
            `这不是一个 EPUB 文件：连 zip 魔数都不对（不是压缩包）。前 80 个字符：${decodeHead(bytes)}`
          );
        }

        if (!containsAscii(bytes, EPUB_CONTAINER_PATH)) {
          throw new Error(
            `这看起来是一个普通 ZIP，不是 EPUB：压缩包里找不到 ${EPUB_CONTAINER_PATH}。前 80 个字符：${decodeHead(bytes)}`
          );
        }

        if (!alive) return;
        setState({ status: "ready", data: buf, size: bytes.length });
      } catch (err) {
        if (!alive) return;
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "EPUB 读取失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [context.file.url]);

  const Reader = useMemo<ReactReaderComponent | null>(() => {
    if (deps.status !== "ready") return null;
    // react-reader 的 d.ts 里 `ReactReader` 的 props 是具体接口，
    // 与这里的「宽松组件」形状不兼容，过一道 unknown
    const mod = deps.mod as unknown as { ReactReader?: ReactReaderComponent };
    return mod.ReactReader ?? null;
  }, [deps]);

  if (deps.status === "unavailable") {
    return (
      <MissingDependency
        pkg="react-reader"
        feature="EPUB 阅读器需要 react-reader（含 epub.js，约 200KB+）"
        hint="只是不想看电子书的话，换一个插件或让文件落到兜底下载即可。"
        error={deps.error.message}
      />
    );
  }

  if (deps.status === "loading" || state.status === "loading") {
    return <LoadingPanel icon="📚" label="正在打开电子书…" />;
  }

  if (state.status === "error") {
    return <ErrorPanel label="EPUB 打开失败" error={state.error} />;
  }

  if (!Reader) {
    return (
      <ErrorPanel
        label="阅读器模块异常"
        error="react-reader 已加载但没有导出 ReactReader 组件（版本不匹配？需要 >=2）。"
      />
    );
  }

  return (
    <div
      data-vfp-epub
      // 章节数只有调试和 e2e 断言用得上（正文面积要全部让给阅读器），
      // 所以挂在属性上而不是画一行字出来
      data-vfp-epub-chapters={chapters}
      style={{ height: "100%", position: "relative", background: "#fff" }}
    >
      <Reader
        // ArrayBuffer 而不是 blob: URL —— 见文件头「为什么把 ArrayBuffer 直接给阅读器」
        url={state.data}
        title={context.file.name}
        location={location}
        locationChanged={(cfi: string) => setLocation(cfi)}
        tocChanged={(toc: unknown[]) => setChapters(toc?.length ?? 0)}
        showToc={config.showToc}
        swipeable={config.swipeable}
        epubOptions={{ allowScriptedContent: false }}
        // react-reader 自己的默认视图是一个英文的 "Error loading book"，
        // 与我们其余 16 个插件的面板风格也不一致。这里换成本地化面板：
        // 用户至少知道「是书解析失败」而不是「阅读器坏了」。
        loadingView={<LoadingPanel icon="📚" label="正在解析电子书…" />}
        errorView={
          <ErrorPanel
            label="EPUB 解析失败"
            error="epub.js 打不开这本书：压缩包结构不全、OPF 指向的章节缺失，或文件已损坏。可以下载后用其他阅读器确认。"
          />
        }
      />
    </div>
  );
}

function EpubToolbar({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  return (
    <ToolbarContainer>
      <FileMeta
        name={context.file.name}
        size={context.file.size}
        type="EPUB"
        icon="📚"
      />
      <ToolbarSeparator />
      {/* 体积已经被 FileMeta 显示了一次，这里只说渲染方式，不重复报数字 */}
      <span style={{ fontSize: 12, color: "#9ca3af" }}>
        epub.js 渲染（章节在 iframe 里）
      </span>
      <ToolbarButton
        onClick={() => triggerDownload(context.file.url, context.file.name)}
        icon="📥"
        title="下载原始 EPUB"
      >
        下载
      </ToolbarButton>
      {config.showToc && (
        <span style={{ fontSize: 11, color: "#c0c4cc" }}>左上角 ☰ 打开目录</span>
      )}
    </ToolbarContainer>
  );
}

export function createEpubPreviewPlugin(
  config: EpubPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: ResolvedConfig = {
    showToc: config.showToc ?? true,
    swipeable: config.swipeable ?? false,
    startLocation: config.startLocation,
  };

  return {
    name: "EpubPreviewPlugin",
    version: "2.0.0",
    description: "EPUB 电子书预览（react-reader / epub.js）",
    supportedTypes: ["application/epub+zip", "application/x-epub+zip"],
    supportedExtensions: [".epub"],
    priority: 8,
    config: resolved,

    hooks: {
      render: (context) => <EpubBody context={context} config={resolved} />,
      renderToolbar: (context) => (
        <EpubToolbar context={context} config={resolved} />
      ),
    },
  };
}

/**
 * 旧名别名。
 *
 * 迁移前的导出叫 `createSimpleReactReaderEpubPlugin`（文件名
 * `SimpleReactReaderEpubPlugin.tsx`）。包还没发布过，但归档仓里的 demo 页
 * 与文档都用这个名字，留一个别名比让 13 个旧示例页全部报错更省事。
 */
export const createSimpleReactReaderEpubPlugin = createEpubPreviewPlugin;

export default createEpubPreviewPlugin;
