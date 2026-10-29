/** ./plugins —— 插件系统 + 官方插件全家桶 */
export { withCommentPlugins } from "../components/CommentPlugin/withCommentPlugins";
export type { WithPluginsConfig } from "../components/CommentPlugin/withCommentPlugins";

export type {
  Plugin,
  PluginContext,
  PluginCreator,
  PluginDoc,
} from "vane-plugin-core";

export type {
  CommentPlugin,
  CommentPluginContext,
  CommentPluginHooks,
  CommentPluginCreator,
} from "../components/CommentPlugin/plugins/types";

export * from "../custom-plugins";
