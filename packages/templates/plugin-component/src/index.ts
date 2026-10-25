/**
 * __PKG_NAME__ 主入口
 * 只导出"核心 + 装配 + 常用插件工厂"，保持默认导入体积最小。
 */
export { __NAME__Core } from "./components/__NAME__Plugin/__NAME__Core";
export type {
  __NAME__CoreProps,
  __NAME__CoreRef,
  __NAME__Item,
  __NAME__PluginHooks,
  __NAME__PluginContext,
} from "./components/__NAME__Plugin/plugins/types";

// 插件系统（来自共用内核，附带领域化别名，避免跨包命名冲突）
export { withPlugins } from "@vane/plugin-core";
export type { Plugin, PluginHooks, PluginContext } from "@vane/plugin-core";

export { createExamplePlugin } from "./custom-plugins/ExamplePlugin";
export type { ExamplePluginConfig } from "./custom-plugins/ExamplePlugin";
