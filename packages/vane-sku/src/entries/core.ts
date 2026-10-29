/**
 * 子路径入口 `vane-sku/entries/core` —— 只要核心组件时导入这里，体积最小。
 * 仅 SkuSelectorCore + 其 props/ref 类型。
 */
export { SkuSelectorCore } from "../components/SkuPlugin/SkuSelectorCore";
export type {
  SkuSelectorCoreProps,
  SkuSelectorCoreRef,
} from "../components/SkuPlugin/plugins/types";
