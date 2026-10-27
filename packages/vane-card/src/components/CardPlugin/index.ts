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
  PluginCreator,
  WithPluginsConfig,
  CardState,
  CardSize,
  DeviceInfo,
  AnimationConfig,
} from "./plugins";

export type { PluginBus } from "./plugins";

export { withPlugins, usePluginSlot, renderDomainSlot } from "./plugins";
export { BusKeys } from "./plugins";
export type { BusKey } from "./plugins";

// 商品数据类型（复合组件的公共契约）
export { matchVariant, variantListOf, attributeMapOf, variantOptionsOf } from "./types/product";
export type { ProductData, ProductVariant, ProductAttributes } from "./types/product";

// 自定义插件统一导出
export * from "./custom-plugins";

// 复合组件导出（ProductCard 及其子组件与类型）
export * from "./compound";
