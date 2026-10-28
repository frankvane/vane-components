/** ./plugins —— 插件系统 + 官方插件全家桶 */
export { withPlugins } from "../components/ProfilePlugin/withPlugins";
export type { WithPluginsConfig } from "../components/ProfilePlugin/withPlugins";

export type {
  Plugin,
  PluginContext,
  PluginCreator,
  PluginDoc,
} from "vane-plugin-core";

export type {
  ProfilePlugin,
  ProfilePluginContext,
  ProfilePluginHooks,
  ProfilePluginCreator,
} from "../components/ProfilePlugin/plugins/types";

export * from "../custom-plugins";
