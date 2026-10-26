/**
 * vane-lazy-image — 高性能 React 图片懒加载组件（插件化架构）
 *
 * 子路径入口（源码路径 == 发布子路径，按需引入）：
 *   - vane-lazy-image                          完整包（核心 + 插件系统 + 全部插件工厂）
 *   - vane-lazy-image/core                     仅核心组件 + ObserverPool（最小体积，6.9KB）
 *   - vane-lazy-image/plugins                  插件系统（withPlugins + 领域类型 + 一等公民插件）
 *   - vane-lazy-image/advanced                 依赖解析 + 版本工具
 *   - vane-lazy-image/monitoring               性能监控 + 全局上下文
 *   - vane-lazy-image/custom-plugins/<XxxPlugin>   单个插件（60 个，8 大领域分组，0.14KB 起）
 *   - vane-lazy-image/presets/<name>               配方（social-feed 等 5 个场景组合）
 *
 * 体积约定（ADR-6）：按需最小体积走 /core 或子路径；根入口为兼容 1.x 的
 * `import { createXxxPlugin } from "vane-lazy-image"` 写法，保留 `export * from "./custom-plugins"`
 * 的桶导出，因此根入口静态图是「一个符号都不用」的未 tree-shake 上界（实测 26.9KB，
 * 预算见 package.json 的 vane.sizeBudgetKb / sizeBudgetNote）。`sideEffects: false` 保证
 * 消费方用 ESM 打包时未用到的插件被摇掉。
 */

// ---------- 核心 ----------
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

// ---------- 插件系统 ----------
export { withPlugins } from "./components/LazyLoadImagePlugin/withPlugins";
export type { WithPluginsConfig } from "./components/LazyLoadImagePlugin/withPlugins";

export type {
  LazyImagePlugin,
  LazyImagePluginCreator,
  LazyImageContext,
  LazyImageHooks,
  LazyImageData,
  LazyImageBusEvents,
  LazyImagePluginBus,
  ProgressInfo,
  NetworkInfo,
  Dimensions,
  InteractionType,
} from "./components/LazyLoadImagePlugin/plugins/types";

// ---------- 全局上下文（性能工程） ----------
export {
  getGlobalNetworkInfo,
  getGlobalDeviceInfo,
  getGlobalContextStats,
  addGlobalContextListener,
  globalContext,
} from "./utils/GlobalContext";

// ---------- Hooks ----------
export { useLCPPreload, useImagePreload } from "./hooks/useLCPPreload";
export type { LCPPreloadOptions } from "./hooks/useLCPPreload";

// ---------- 性能监控 ----------
export {
  createPerformanceMonitor,
  getGlobalMonitorManager,
  resetGlobalMonitorManager,
} from "./utils/PerformanceMonitor";
export type {
  PerformanceMonitor,
  PerformanceReport,
  PerformanceMetrics,
  PerformanceMonitorConfig,
} from "./utils/PerformanceMonitor";

// ---------- 高级能力（依赖解析 / 沙箱 / 版本工具）----------
export * from "./advanced";

// ---------- 自定义插件与配方：根入口便捷桶导出（按需引入仍 tree-shakeable）----------
// 说明：ADR-6 初衷是避免“无脑 import 整个包”导致静态图膨胀；但 tree-shaking 下
// `export *` 仅暴露命名绑定，消费方只取所需符号不会被整包打入。为兼容旧版示例
// `import { createXxxPlugin } from "vane-lazy-image"` 的写法并降低上层接入成本，
// 这里在根入口聚合所有插件工厂（含旧名别名 createIDBCachePlugin 等）。
export * from "./custom-plugins";

// ---------- 版本 ----------
export const LAZY_IMAGE_CORE_VERSION = "2.0.0";
