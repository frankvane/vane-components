/** ./plugins —— 插件系统 + 官方插件全家桶 */
export { withPlugins } from "../components/WaterfallPlugin/withPlugins";
export type { WithPluginsConfig } from "../components/WaterfallPlugin/withPlugins";
export type {
  Plugin,
  PluginContext,
  PluginCreator,
  PluginDoc,
} from "@vane/plugin-core";
export type {
  WaterfallPlugin,
  WaterfallPluginCreator,
  WaterfallPluginContext,
  WaterfallPluginHooks,
} from "../components/WaterfallPlugin/plugins/types";

export * from "../custom-plugins";
