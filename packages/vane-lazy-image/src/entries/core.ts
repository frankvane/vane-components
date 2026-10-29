/**
 * 子路径入口 `vane-lazy-image/entries/core` —— 只要核心组件时导入这里，体积最小。
 * 与 `vane-lazy-image/core` 对齐：仅 LazyLoadImageCore + 其 props/ref 类型。
 */
export { LazyLoadImageCore } from "../components/LazyLoadImagePlugin/LazyLoadImageCore";
export type { LazyLoadImageCoreProps, LazyLoadImageCoreRef } from "../components/LazyLoadImagePlugin/LazyLoadImageCore";
