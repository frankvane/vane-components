/**
 * 子路径入口 `vane-file-preview/plugins` —— 6 个**零重依赖**的插件。
 *
 * ## 为什么只有 6 个
 *
 * 17 个插件里只有这 6 个完全用原生标签实现（`<img>` / `<iframe>` / `<video>` /
 * `<audio>` / `<button>`），装包不增加任何依赖：图片、PDF、视频、音频、兜底下载、
 * Office 在线预览。它们同时被根入口聚合（ADR-16 D3）。
 *
 * 剩下 11 个各自需要 optional peer（`jszip` / `xlsx` / `mammoth` /
 * `docx-preview` / `react-syntax-highlighter` / …），**一律走各自子路径**：
 *
 * ```ts
 * import { createZipPreviewPlugin } from "vane-file-preview/custom-plugins/ZipPreviewPlugin";
 * ```
 *
 * 根入口刻意不桶导出它们：迁移前根入口就是 `export * from "./custom-plugins"` 一个桶，
 * 结果 mammoth 整库与 41 套 prism 主题全被拉进单文件 → 196.33KB gzip。
 *
 * ## 只想自己写插件
 *
 * 用 `vane-file-preview/core`（≤8KB），不要引这个入口。
 */

// ===== 图片 =====
export { createImagePreviewPlugin } from "./custom-plugins/ImagePreviewPlugin";
export type { ImagePreviewPluginConfig } from "./custom-plugins/ImagePreviewPlugin";

// ===== 文档 =====
export { createPdfPreviewPlugin } from "./custom-plugins/PdfPreviewPlugin";
export type { PdfPreviewPluginConfig } from "./custom-plugins/PdfPreviewPlugin";

export { createOfficePreviewPlugin } from "./custom-plugins/OfficePreviewPlugin";
export type {
  OfficePreviewPluginConfig,
  OfficeViewer,
} from "./custom-plugins/OfficePreviewPlugin";

// ===== 音视频 =====
export { createVideoPreviewPlugin } from "./custom-plugins/VideoPreviewPlugin";
export type { VideoPreviewPluginConfig } from "./custom-plugins/VideoPreviewPlugin";

export { createAudioPreviewPlugin } from "./custom-plugins/AudioPreviewPlugin";
export type { AudioPreviewPluginConfig } from "./custom-plugins/AudioPreviewPlugin";

// ===== 兜底 =====
export { createDownloadPlugin } from "./custom-plugins/DownloadPlugin";
export type { DownloadPluginConfig } from "./custom-plugins/DownloadPlugin";
