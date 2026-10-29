/**
 * 子路径入口 `vane-card/entries/core` —— 只要核心组件时导入这里，体积最小（不含插件与复合组件）。
 * 与 `vane-card/core` 对齐：仅 CardCore + 其 props/ref 类型。
 */
export { default as CardCore } from "../components/CardPlugin/core/CardCore";
export type { CardCoreProps, CardCoreRef } from "../components/CardPlugin/core/CardCore";
