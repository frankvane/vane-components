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
} from "./components/SkuPlugin/matrix";

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
