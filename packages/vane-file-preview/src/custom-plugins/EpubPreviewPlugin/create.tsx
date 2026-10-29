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

/**
 * 失败信息里那段「文件开头是什么」。
 *
 * 上一版是 `new TextDecoder().decode(head).slice(0, 80)` —— 对二进制文件直接把
 * 原始字节当 UTF-8 解，屏幕上就是一片 `PK☐☐☐UO☐☐` 加一堆替换符。对最后一个
 * 「打不开」的提示来说，这既没有信息量，还像是程序崩了。
 *
 * 现在分三档：能认出格式就说格式；是纯文本就引一段原文；都不是才退到十六进制。
 */
function hexHead(bytes: Uint8Array, count = 8): string {
  return Array.from(bytes.subarray(0, count))
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

/**
 * 只认最常见的那几种 —— 这是给人看的提示，不是 file 命令。
 * 导出仅供单测（造几个假头部就能覆盖分支，比塞真文件省事）。
 */
export function sniffFormat(bytes: Uint8Array): string | null {
  const at = (i: number) => bytes[i] ?? -1;
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47) return "PNG 图片";
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "JPEG 图片";
  if (at(0) === 0x47 && at(1) === 0x49 && at(2) === 0x46) return "GIF 图片";
  if (at(0) === 0x25 && at(1) === 0x50 && at(2) === 0x44 && at(3) === 0x46) return "PDF 文档";
  if (at(0) === 0x1f && at(1) === 0x8b) return "GZIP 压缩包";
  if (at(0) === 0x52 && at(1) === 0x61 && at(2) === 0x72 && at(3) === 0x21) return "RAR 压缩包";
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, 200))
    .trimStart()
    .toLowerCase();
  if (head.startsWith("<!doctype html") || head.startsWith("<html"))
    return "HTML 页面（服务器很可能返回了 404 或登录页，而不是文件本身）";
  return null;
}

/**
 * 内容是不是「像文本」的，是就返回开头一小段。
 *
 * 判据只看可打印字符比例：二进制文件里 0x00~0x1f 的控制字符会成片出现，
 * 而 JSON / XML / 脚本基本都是可打印 ASCII。导出仅供单测。
 */
export function readableText(bytes: Uint8Array, limit = 60): string | null {
  const slice = bytes.subarray(0, 200);
  if (slice.length === 0) return null;
  let printable = 0;
  for (const b of slice) {
    if (b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b !== 0x7f)) printable++;
  }
  if (printable / slice.length < 0.95) return null;
  return new TextDecoder("utf-8", { fatal: false })
    .decode(slice)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

/**
 * 把 zip 条目缩成「一眼能认出这是什么项目」的长度。
 *
 * 直接截前 36 个字符会出现 `src/components/FilePreviewPlugin/co…` 与
 * `…/cu…` 这种两条几乎一样的条目 —— 路径前缀把信息量全占了，文件名（唯一
 * 有区别的部分）反而被截掉。所以深路径只留 `…/文件名`。
 */
export function shortenEntry(name: string, limit = 28): string {
  const parts = name.split("/");
  const short = parts.length > 2 ? `…/${parts[parts.length - 1]}` : name;
  return short.length > limit ? `${short.slice(0, limit - 1)}…` : short;
}

/**
 * 从中央目录里抄出前几个条目名。
 *
 * 只用来「让错误信息说得具体」，所以不引 jszip，但**必须按 EOCD 正经解析**。
 * 第一版是全文线性扫 `PK\x01\x02` 然后按固定偏移读长度 —— 真 zip 里压缩数据
 * 完全可能恰好包含这四个字节，读出来的就是一段随机字节当文件名，面板上又是
 * 一片乱码（和上一版的 `PK☐☐☐UO☐` 一样难看的另一种形式）。测试用的合成 zip
 * 没有压缩数据，所以那条断言是绿的 —— 又一次「单测绿、真文件红」。
 *
 * 正确路径：文件尾的 EOCD（`PK\x05\x06`）→ 中央目录偏移 → 顺序走记录。
 * 导出的原因：单测要直接验它。
 */
export function listZipEntries(bytes: Uint8Array, limit = 8): string[] {
  if (bytes.length < 22) return [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder("utf-8", { fatal: false });

  // EOCD 之后最多跟 64KB 注释，所以只在尾部这一段里找
  let eocd = -1;
  const stop = Math.max(0, bytes.length - 22 - 0xffff);
  for (let i = bytes.length - 22; i >= stop; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return [];

  let offset = view.getUint32(eocd + 16, true);
  const total = view.getUint16(eocd + 10, true);
  const names: string[] = [];

  for (let n = 0; n < total && names.length < limit; n++) {
    if (offset + 46 > bytes.length) break;
    if (
      bytes[offset] !== 0x50 ||
      bytes[offset + 1] !== 0x4b ||
      bytes[offset + 2] !== 0x01 ||
      bytes[offset + 3] !== 0x02
    ) {
      break;
    }
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const start = offset + 46;
    if (start + nameLen > bytes.length) break;
    const name = decoder.decode(bytes.subarray(start, start + nameLen)).trim();
    // 目录条目（`src/`）对「这到底是什么文件」没有信息量，跳过
    if (name && !name.endsWith("/")) names.push(name);
    offset = start + nameLen + extraLen + commentLen;
  }
  return names;
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
          const format = sniffFormat(bytes);
          const text = readableText(bytes);
          throw new Error(
            `这不是一个 EPUB 文件：文件头是 ${hexHead(bytes)}` +
              (format ? `，看起来像 ${format}` : "，不是 zip 压缩包") +
              (text ? `。开头内容：「${text}」` : "")
          );
        }

        if (!containsAscii(bytes, EPUB_CONTAINER_PATH)) {
          const entries = listZipEntries(bytes);
          // 七八条深路径就能把面板撑成十几行。这个面板要的是「一眼看出这不是本书」，
          // 不是完整目录树：取前 5 条、深路径只留 `…/文件名`。
          const shown = entries.slice(0, 5).map((name) => shortenEntry(name));
          throw new Error(
            `这看起来是一个普通 ZIP，不是 EPUB：压缩包里找不到 ${EPUB_CONTAINER_PATH}。` +
              (shown.length
                ? `实际条目是：${shown.join("、")}${entries.length > 5 ? " 等" : ""}。`
                : "")
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
    return (
      <ErrorPanel
        label="EPUB 打开失败"
        error={state.error}
        action={{
          label: "下载原始文件",
          onClick: () => triggerDownload(context.file.url, context.file.name),
        }}
      />
    );
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
            action={{
              label: "下载原始文件",
              onClick: () => triggerDownload(context.file.url, context.file.name),
            }}
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
      {/*
        这里原来写着「epub.js 渲染（章节在 iframe 里）」。删掉有两个原因：
        ① 它是实现细节，对看书的人没有信息量；
        ② 打开失败时它自相矛盾 —— 正文是「EPUB 打开失败」，工具栏还在说
           「章节在 iframe 里」。工具栏在装配层，看不到 EpubBody 的局部状态，
           要修就得为这一句装饰性文案引入跨组件状态，不划算。
      */}
      <ToolbarButton
        onClick={() => triggerDownload(context.file.url, context.file.name)}
        icon="📥"
        title="下载原始 EPUB"
      >
        下载
      </ToolbarButton>
      {config.showToc && (
        <span style={{ fontSize: 11, color: "#6b6b6b" }}>左上角 ☰ 打开目录</span>
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
