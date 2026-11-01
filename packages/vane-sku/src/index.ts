/**
 * vane-sku 主入口（子路径 "."）
 *
 * 只导出「核心 + 装配 + 类型」，插件一律走子路径按需引入（ADR-6）：
 *   import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
 */
export { SkuSelectorCore } from "./components/SkuPlugin/SkuSelectorCore";
export { withPlugins } from "./components/SkuPlugin/withPlugins";
export { createSkuSelector, SkuSelector } from "./components/SkuPlugin/createSkuSelector";

/** 组合矩阵 + 禁用推导（纯函数，可单独测试/复用） */
export {
  buildAvailability,
  matchVariant,
  isSelectionComplete,
  isPurchasable,
  effectiveVariants,
} from "./components/SkuPlugin/matrix";

/** 数据 / 选择态归一化（外部输入白名单，纯函数） */
export {
  normalizeSkuData,
  normalizeSelection,
  isSameSelection,
} from "./components/SkuPlugin/normalize";

/** 数量 / 价格口径（Quota 与 Quantity 共用） */
export {
  remainingQuota,
  quantityUpper,
  formatPrice,
  formatPriceValue,
} from "./components/SkuPlugin/limits";

export type { NormalizedSkuData } from "./components/SkuPlugin/normalize";
export type { AvailabilityOptions, Availability } from "./components/SkuPlugin/matrix";

export type {
  SkuAttribute,
  SkuOption,
  SkuSelection,
  SkuSlots,
  SkuVariant,
  SkuPlugin,
  SkuPluginContext,
  SkuPluginCreator,
  SkuPluginHooks,
  SkuSelectorCoreProps,
  SkuSelectorCoreRef,
} from "./components/SkuPlugin/plugins/types";
