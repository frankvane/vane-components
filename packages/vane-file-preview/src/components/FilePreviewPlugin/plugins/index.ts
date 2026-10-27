/**
 * 插件系统出口。
 *
 * ⚠️ P1 阶段仍是迁移前那套（PluginManager / PluginBus / 17 个钩子）。
 * P2 会把它换成 `@vane/plugin-core` + `resolvePreview()` 纯函数，钩子面收到 11 个。
 * 现在先原样导出，保证 P1 的 Core 单测能跑起来。
 */

export { withPlugins } from "./withPlugins";
export type { WithPluginsConfig } from "./withPlugins";
export { createPluginBus } from "./PluginBus";
export { createPluginManager } from "./PluginManager";

export type {
  FileInfo,
  PreviewDimensions,
  PreviewProgress,
  PreviewState,
  PreviewStateInfo,
  PreviewStatePatch,
  PluginBus,
  PluginContext,
  PluginHooks,
  FilePreviewPlugin,
  PluginManager,
} from "./types";
