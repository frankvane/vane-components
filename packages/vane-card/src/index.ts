/**
 * vane-card 包根入口 —— 只聚合「内核 + 插件系统 + 契约类型」。
 *
 * 刻意**不**桶导出 22 个官方插件、38 个复合组件与 3 个配方（ADR-6）：
 * 它们各自有子路径（`vane-card/custom-plugins/X`、`vane-card/compound`、
 * `vane-card/presets/x`），谁要谁引。根入口因此稳定在个位数 KB，
 * 不会因为官方补一个插件就让所有使用者的包变大。
 *
 * 如果你只写自己的插件：`import { withPlugins } from "vane-card/plugins"`，
 * 连 CardCore 都不用带来（更小）。
 */

// ===== Core =====
export { default as CardCore } from "./components/CardPlugin/core/CardCore";
export type { CardCoreProps, CardCoreRef } from "./components/CardPlugin/core/CardCore";

// ===== 插件系统（装配器 / 领域槽位 / 总线键 / 15 个钩子的类型）=====
export { withPlugins, usePluginSlot, renderDomainSlot, BusKeys } from "./components/CardPlugin/plugins";
export type {
  CardPlugin,
  CardPluginContext,
  CardPluginHooks,
  PluginCreator,
  WithPluginsConfig,
  PluginBus,
  BusKey,
  CardState,
  CardSize,
  DeviceInfo,
  AnimationConfig,
} from "./components/CardPlugin/plugins";

// 别名导出（1.x 起沿用的两个名字，不新增）
export { withPlugins as withCardPlugins } from "./components/CardPlugin/plugins";
export type {
  PluginBus as CardPluginBus,
  PluginCreator as CardPluginCreator,
  WithPluginsConfig as CardWithPluginsConfig,
} from "./components/CardPlugin/plugins";

// ===== 商品数据契约（不依赖任何插件）=====
export { matchVariant, variantListOf, attributeMapOf, variantOptionsOf } from "./components/CardPlugin/types/product";
export type {
  ProductData,
  ProductVariant,
  ProductAttributes,
} from "./components/CardPlugin/types/product";
