/**
 * CardPlugin 系统入口
 */

// 核心组件显式导出
export { default as CardCore } from "./core/CardCore";
export type { CardCoreProps, CardCoreRef } from "./core/CardCore";

// 插件系统显式命名导出
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
} from "./plugins";

export { createPluginBus } from "./plugins";
export { createPluginManager } from "./plugins";
export { withPlugins } from "./plugins";

// 自定义插件统一导出
export * from "./custom-plugins";

// 复合组件导出（ProductCard 及其子组件与类型）
export * from "./compound";
