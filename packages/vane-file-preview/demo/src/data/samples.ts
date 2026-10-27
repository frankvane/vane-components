/**
 * 样本台账
 * ----------------------------------------------------------------------------
 * 全部是 `demo/public/samples/` 里的**真文件**（36 个从归档搬来的 + 3 个自建）。
 *
 * 为什么不用 data URL / 占位字符串：图片能骗过去，PDF 查看器、视频解码器、
 * xlsx 解析器、DOCX 的 OOXML、EPUB 的 zip 结构都骗不过去。这些样本的价值
 * 恰恰在「浏览器真的解得开」——所以它们必须是字节真实的文件。
 *
 * `size` 是字节数不是估算：工具栏读数是 `formatBytes(size)`，写错会让「1.0 MB」
 * 和页脚的真实文件大小对不上（上一轮就踩过 1048558 → "1024.0 KB"）。
 */
import type { FileInfo } from "vane-file-preview";

export interface Sample extends FileInfo {
  /** 一句说明：这份样本专门用来验什么 */
  note?: string;
}

const base = (name: string, type: string, extension: string, size: number, note?: string): Sample => ({
  name,
  type,
  extension,
  size,
  url: `/samples/${name}`,
  note,
});

/** 全部样本，键 = 文件名。新增文件时只改这张表。 */
export const SAMPLES: Record<string, Sample> = {
  // ---- 图片 ----
  "sample.jpg": base("sample.jpg", "image/jpeg", "jpg", 44155, "JPEG · 缩放/旋转"),
  "sample.png": base("sample.png", "image/png", "png", 134340, "PNG · 带透明通道"),
  "sample.gif": base("sample.gif", "image/gif", "gif", 104327, "GIF · 动图"),
  "sample.webp": base("sample.webp", "image/webp", "webp", 3072, "WebP · 同尺寸小一个量级"),
  "sample.svg": base("sample.svg", "image/svg+xml", "svg", 1497, "SVG · 矢量"),

  // ---- PDF ----
  "star.pdf": base("star.pdf", "application/pdf", "pdf", 144370, "单页正常版式"),
  "danmu.pdf": base("danmu.pdf", "application/pdf", "pdf", 246175, "多页 + 弹幕图层"),
  "white-screen.pdf": base("white-screen.pdf", "application/pdf", "pdf", 109114, "近乎全白 · 几何体检用"),

  // ---- 音视频 ----
  "sample.mp4": base("sample.mp4", "video/mp4", "mp4", 2498125, "H.264 · 必然能播"),
  "sample.webm": base("sample.webm", "video/webm", "webm", 2165175, "WebM · 同一 <video>"),
  "sample.flv": base("sample.flv", "video/x-flv", "flv", 1055398, "FLV 但里面是 H.264 · Chromium 实测能播"),
  "sample.avi": base("sample.avi", "video/x-msvideo", "avi", 742478, "DivX/Xvid · 必然播不了"),
  "sample.mp3": base("sample.mp3", "audio/mpeg", "mp3", 4090342, "最常见的有声音频"),
  "sample.ogg": base("sample.ogg", "audio/ogg", "ogg", 104793, "OGG Vorbis"),
  "sample.wav": base("sample.wav", "audio/wav", "wav", 1048558, "无损 · 体积大（formatBytes 的进位样本）"),

  // ---- Office ----
  "sample.docx": base(
    "sample.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "docx",
    20817,
    "带标题/表格/列表"
  ),
  "sample.xlsx": base(
    "sample.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xlsx",
    13060,
    "多 Sheet"
  ),
  "sample.pptx": base(
    "sample.pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "pptx",
    2090655,
    "含图片版式 · 大纲预览只抽文字"
  ),

  // ---- 代码 / 文本 ----
  "sample.js": base("sample.js", "text/javascript", "js", 1208, "JS"),
  "sample.ts": base("sample.ts", "text/typescript", "ts", 1368, "TS"),
  "sample.tsx": base("sample.tsx", "text/typescript", "tsx", 5471, "TSX"),
  "sample.vue": base("sample.vue", "text/x-vue", "vue", 3302, "Vue SFC"),
  "sample.css": base("sample.css", "text/css", "css", 1464, "CSS"),
  "sample.html": base("sample.html", "text/html", "html", 6373, "HTML"),
  "sample.md": base("sample.md", "text/markdown", "md", 195239, "长文 · 标题/表格/代码块都全"),
  "xss-demo.md": base("xss-demo.md", "text/markdown", "md", 698, "内嵌 <img onerror> · 验 allowHtml 默认关"),

  // ---- 结构化数据 ----
  "sample.json": base("sample.json", "application/json", "json", 1605, "嵌套对象"),
  "package.json": base("package.json", "application/json", "json", 870, "真实 package.json"),
  "sample.xml": base("sample.xml", "text/xml", "xml", 1033, "普通 XML"),
  "sample.rss": base("sample.rss", "application/rss+xml", "rss", 911, "RSS · 同一套树视图"),
  "sample-data.csv": base("sample-data.csv", "text/csv", "csv", 963, "逗号分隔"),
  "sample-data-semicolon.csv": base("sample-data-semicolon.csv", "text/csv", "csv", 567, "分号分隔 · 自动识别"),
  "sample-data-pipe.csv": base("sample-data-pipe.csv", "text/csv", "csv", 683, "竖线分隔 · 自动识别"),
  "sales-data.tsv": base("sales-data.tsv", "text/tab-separated-values", "tsv", 984, "Tab 分隔"),
  "gbk-data.csv": base("gbk-data.csv", "text/csv", "csv", 116, "GB18030 编码 · 中文不乱码"),
  "mixed-data.csv": base("mixed-data.csv", "text/csv", "csv", 464, "数字/日期/空值混排 · 排序用"),

  // ---- 压缩包 / 电子书 ----
  "sample.zip": base("sample.zip", "application/zip", "zip", 97668, "普通 zip"),
  "sample.epub": base("sample.epub", "application/epub+zip", "epub", 188879, "Alice in Wonderland · 16 章"),
  "fake-book.epub": base("fake-book.epub", "application/epub+zip", "epub", 97668, "zip 改名 · 会列出包内实际条目"),
};

export function getSample(name: string): Sample {
  const s = SAMPLES[name];
  if (!s) {
    // 静默返回一个空文件比抛错更糟：页面会渲染成「空文件」，看起来像插件坏了。
    // 直接抛，让错在开发时就暴露。
    throw new Error(`未登记的样本：${name}`);
  }
  return s;
}

/** 按文件名批量取，页面里写 `pick("a.jpg", "b.png")` 比手写对象可读 */
export function pick(...names: string[]): Sample[] {
  return names.map(getSample);
}

export const SAMPLE_COUNT = Object.keys(SAMPLES).length;
