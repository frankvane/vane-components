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

import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { EpubBody, EpubToolbar } from "./internal";

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
