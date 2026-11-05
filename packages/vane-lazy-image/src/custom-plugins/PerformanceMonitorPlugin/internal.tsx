/**
 * PerformanceMonitorPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import type React from "react";

import type { LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import type { PerformanceMonitorConfig } from "./create";

export function PerformanceOverlay({ context, cfg }: { context: LazyImageContext; cfg: PerformanceMonitorConfig }) {
  const pd = context.performanceData || { duration: undefined };
  if (!cfg.showOverlay) return null;
  if (!context.imageState.isLoaded) return null;

  const pos = cfg.overlayPosition ?? "top-right";
  const base: React.CSSProperties = {
    position: "absolute",
    zIndex: 9,
    background: cfg.background ?? "rgba(0,0,0,0.45)",
    color: cfg.color ?? "#fff",
    fontSize: 12,
    padding: "2px 6px",
    borderRadius: 4,
  };
  if (pos.includes("top")) base.top = 6;
  if (pos.includes("bottom")) base.bottom = 6;
  if (pos.includes("left")) base.left = 6;
  if (pos.includes("right")) base.right = 6;

  return <div style={base}>Loaded in {Math.round((pd.duration || 0))} ms</div>;
}
