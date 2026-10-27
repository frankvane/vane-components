/**
 * 子路径入口 `vane-card/core` —— 只要 Core，不付插件与复合组件的钱。
 *
 * 适用：自己写行为、或只把 CardCore 当「带生命周期与 ref 的容器」用。
 * 预算 ≤5KB gzip（体积体检按 coreSizeBudgetKb 单独量这一支）。
 *
 * 注意：CardCore 单独用没有图片/价格/操作区 —— 那些全在插件里，
 * 卡片上会只剩你传进 children 的内容。这是设计，不是缺失。
 */

export { default as CardCore } from "./components/CardPlugin/core/CardCore";
export type { CardCoreProps, CardCoreRef } from "./components/CardPlugin/core/CardCore";

// 商品数据类型（不依赖任何插件，属于「契约」而不是「实现」）
export { matchVariant, variantListOf, attributeMapOf, variantOptionsOf } from "./components/CardPlugin/types/product";
export type {
  ProductData,
  ProductVariant,
  ProductAttributes,
} from "./components/CardPlugin/types/product";
