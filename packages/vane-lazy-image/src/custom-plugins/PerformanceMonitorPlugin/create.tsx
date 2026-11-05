import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import { PerformanceOverlay } from "./internal";

export interface PerformanceMonitorConfig {
  showOverlay?: boolean;
  overlayPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  color?: string;
  background?: string;
  onReport?: (data: {
    src: string;
    durationMs: number;
    network?: LazyImageContext["networkInfo"];
    device?: LazyImageContext["deviceInfo"];
  }) => void;
}

export function createPerformanceMonitorPlugin(config: PerformanceMonitorConfig = {}): LazyImagePlugin {
  // ⭐ 添加报告防抖，避免高频重复报告
  const reportedKeys = new Set<string>();
  const DEBOUNCE_TIME = 100;
  const lastReportTime = new Map<string, number>();

  return {
    name: "performance-monitor",
    version: "1.0.0",
    config,
    hooks: {
      onLoadSuccess: (context) => {
        // ⭐ 防止重复报告同一个src
        if (reportedKeys.has(context.src)) {
          return; // 已报告过，跳过
        }

        // ⭐ 防抖：短时间内重复调用只触发一次
        const now = Date.now();
        const last = lastReportTime.get(context.src) || 0;
        if (now - last < DEBOUNCE_TIME) {
          return;
        }

        lastReportTime.set(context.src, now);
        reportedKeys.add(context.src);

        const pd = context.performanceData || { duration: 0 };
        const payload = {
          src: context.src,
          durationMs: Math.round(pd.duration || 0),
          network: context.networkInfo,
          device: context.deviceInfo,
        };
        try {
          if (config.onReport) config.onReport(payload);
        } catch {}
      },
      renderOverlay: (context) => <PerformanceOverlay context={context} cfg={config} />,
    },
  };
}
