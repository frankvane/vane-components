/**
 * 插件系统出口（P2 · 接内核后）。
 *
 * 迁移前这里有 `createPluginBus` / `createPluginManager` —— 两个自建实现共 689 行，
 * 与内核重复。已删除：注册、依赖解析、优先级排序、钩子执行、沙箱都走 @vane/plugin-core。
 *
 * 新增 `resolvePreview()`：单赢家路由的纯函数，可单测（这是本包最要紧的契约，
 * 「17 种文件分别该由谁渲染」不该藏在渲染层里靠嗅 DOM 验证）。
 */

export { withPlugins } from "./withPlugins";
export type { WithPluginsConfig } from "./types";

export {
  resolvePreview,
  accepts,
  priorityOf,
  matchMimeType,
  matchExtension,
  unsupportedMessage,
} from "./resolve";

export type {
  FileInfo,
  PreviewState,
  PreviewStateInfo,
  PreviewStatePatch,
  PreviewDimensions,
  PreviewProgress,
  PluginBus,
  DeviceInfo,
  PluginLogger,
  FilePreviewPluginContext,
  FilePreviewPluginHooks,
  FilePreviewPlugin,
  FilePreviewPluginCreator,
} from "./types";
