/**
 * 子路径入口 `vane-file-preview/entries/core` —— 只要内核时导入这里，体积最小（不含任何插件）。
 * 与 `vane-file-preview/core` 对齐：仅 FilePreviewCore + 其 props/ref 类型。
 */
export { FilePreviewCore, FilePreviewCore as default } from "../components/FilePreviewPlugin/core/FilePreviewCore";
export type { FilePreviewCoreProps, FilePreviewCoreRef } from "../components/FilePreviewPlugin/core/FilePreviewCore";
