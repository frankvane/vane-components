/**
 * CardPlugin 插件系统入口
 */

// 类型导出
export type {
  CardPlugin,
  CardPluginContext,
  CardPluginHooks,
  PluginManager,
  PluginBus,
  PluginCreator,
  WithPluginsConfig,
  CardState,
  CardSize,
  DeviceInfo,
  AnimationConfig,
} from "./types";

// 功能导出
export { createPluginBus } from "./PluginBus";
export { createPluginManager } from "./PluginManager";
export { withPlugins } from "./withPlugins";
export { BusKeys } from "./BusKeys";
export type { BusKey } from "./BusKeys";
