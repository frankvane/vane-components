/**
 * @module vane-lazy-image/monitoring
 * 性能监控：PerformanceMonitor + 全局上下文（网络/设备检测单例）。
 */

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

export {
  getGlobalNetworkInfo,
  getGlobalDeviceInfo,
  getGlobalContextStats,
  addGlobalContextListener,
  globalContext,
} from "./utils/GlobalContext";
