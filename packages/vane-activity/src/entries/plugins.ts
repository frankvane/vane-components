/** ./plugins —— 插件系统 + 官方插件全家桶 */
export { withPlugins } from "../components/ActivityPlugin/withPlugins";
export type { WithPluginsConfig } from "vane-plugin-core";
export type {
  ActivityPlugin,
  ActivityPluginContext,
  ActivityPluginHooks,
  ActivityPluginCreator,
} from "../components/ActivityPlugin/plugins/types";

export * from "../custom-plugins";
