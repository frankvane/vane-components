/**
 * 子路径入口 `vane-file-preview/core` —— 只要内核，不付任何插件的钱。
 *
 * 适用：自己写插件（继承 `FilePreviewPlugin` 契约），或只把 Core 当成
 * 「带加载状态机与 ref 的容器」用。
 * 预算 ≤8KB（`vane.coreSizeBudgetKb` 单独量这一支）。
 *
 * 注意：单用 Core 不会显示任何东西 —— 文件怎么画全在插件里，
 * 卡上只剩你传进 `children` 的内容。这是设计，不是缺失。
 */

export {
  FilePreviewCore,
  FilePreviewCore as default,
} from "./components/FilePreviewPlugin/core/FilePreviewCore";
export type {
  FilePreviewCoreProps,
  FilePreviewCoreRef,
  ExternalPreviewRef,
} from "./components/FilePreviewPlugin/core/FilePreviewCore";

// ===== 装配器 =====
export { withPlugins } from "./components/FilePreviewPlugin/plugins/withPlugins";
export type { WithPluginsConfig } from "./components/FilePreviewPlugin/plugins/withPlugins";

// ===== 契约类型（不依赖任何插件，属于契约而不是实现）=====
export type {
  FileInfo,
  PreviewState,
  PreviewStateInfo,
  PreviewStatePatch,
  PreviewDimensions,
  PreviewProgress,
  PluginBus,
  PluginContext,
  PluginHooks,
  FilePreviewPlugin,
} from "./components/FilePreviewPlugin/plugins/types";
