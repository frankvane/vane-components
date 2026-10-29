/**
 * 子路径入口 `vane-file-preview/entries/plugins` —— 插件系统 + 官方插件全家桶。
 * 写自己的插件只用 `vane-file-preview/core`；要全量官方插件走这里（17 个）。
 */
export { withPlugins } from "../components/FilePreviewPlugin/plugins/withPlugins";
export type { WithPluginsConfig } from "../components/FilePreviewPlugin/plugins/types";

export * from "../custom-plugins";
