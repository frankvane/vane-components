/**
 * 子路径入口 `vane-lazy-image/entries/plugins` —— 插件系统 + 官方插件全家桶（60 个）。
 * 写自己的插件只用 `vane-lazy-image/plugins`；要全量官方插件走这里。
 */
export { withPlugins } from "../components/LazyLoadImagePlugin/withPlugins";
export type { WithPluginsConfig } from "../components/LazyLoadImagePlugin/withPlugins";

export * from "../custom-plugins";
