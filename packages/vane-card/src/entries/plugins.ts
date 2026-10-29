/**
 * 子路径入口 `vane-card/entries/plugins` —— 插件系统 + 官方插件全家桶。
 * 写自己的插件只用 `vane-card/plugins`（不含官方实现）；要全量官方插件走这里。
 */
export { withPlugins, usePluginSlot, renderDomainSlot } from "../components/CardPlugin/plugins";
export { BusKeys } from "../components/CardPlugin/plugins";
export type {
  CardPlugin,
  CardPluginContext,
  CardPluginHooks,
  PluginCreator,
  WithPluginsConfig,
} from "../components/CardPlugin/plugins";

export * from "../custom-plugins";
