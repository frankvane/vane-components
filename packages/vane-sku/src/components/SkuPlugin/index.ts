/**
 * 领域内部聚合（components/ 不发布为入口，仅包内与根入口引用）
 */
export { SkuSelectorCore } from "./SkuSelectorCore";
export { withPlugins } from "./withPlugins";
export { createSkuSelector, SkuSelector } from "./createSkuSelector";
export { buildAvailability, matchVariant, isSelectionComplete } from "./matrix";
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
} from "./plugins/types";
