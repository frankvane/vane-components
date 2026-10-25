/**
 * @module vane-lazy-image/core
 * 核心懒加载功能（最小入口）：LazyLoadImageCore + ObserverPool + 常量。
 */

export const LAZY_IMAGE_CORE_VERSION = "2.0.0";

export { LazyLoadImageCore as default } from "./components/LazyLoadImagePlugin/LazyLoadImageCore";
export { LazyLoadImageCore } from "./components/LazyLoadImagePlugin/LazyLoadImageCore";
export type {
  LazyLoadImageCoreProps,
  LazyLoadImageCoreRef,
  ImageState,
} from "./components/LazyLoadImagePlugin/LazyLoadImageCore";

export {
  observeElement,
  unobserveElement,
  getObserverPoolStats,
  setObserverPoolDebugMode,
  getObserverPoolDetails,
  cleanupObserverPool,
  resetObserverPoolStats,
  observerPool,
} from "./components/LazyLoadImagePlugin/ObserverPool";
export type { ObserverConfig, PoolStats } from "./components/LazyLoadImagePlugin/ObserverPool";

export * from "./components/LazyLoadImagePlugin/constants";
