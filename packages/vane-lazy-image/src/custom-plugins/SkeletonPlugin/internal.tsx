/**
 * SkeletonPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import type React from "react";

import type { LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import type { SkeletonPluginConfig } from "./create";

const SKELETON_STYLE_ID = "lli-skeleton-style";
const SKELETON_STYLE_TEXT = `
@keyframes lli-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes lli-skeleton-pulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.6; }
}
`;

/**
 * P2-2：全局 keyframes 只注入一次（而非每个实例一份 <style>）。
 */
function ensureSkeletonStyle(): void {
  if (typeof document === "undefined") return;
  try {
    if (document.getElementById(SKELETON_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = SKELETON_STYLE_ID;
    style.textContent = SKELETON_STYLE_TEXT;
    document.head.appendChild(style);
  } catch {}
}

export function SkeletonOverlay({
  imageState,
  type = "shimmer",
  backgroundColor = "#e5e7eb",
  highlightColor = "#f3f4f6",
  borderRadius = 4,
  zIndex = 2,
  showWhen = "loading",
}: {
  imageState: LazyImageContext["imageState"];
  type?: SkeletonPluginConfig["type"];
  backgroundColor?: string;
  highlightColor?: string;
  borderRadius?: number;
  zIndex?: number;
  showWhen?: SkeletonPluginConfig["showWhen"];
}) {
  const visible = showWhen === "always" ? true : imageState.isLoading;
  if (!visible) return null;

  ensureSkeletonStyle();

  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex,
  };

  const shimmerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundImage: `linear-gradient(90deg, ${backgroundColor} 0%, ${backgroundColor} 35%, ${highlightColor} 50%, ${backgroundColor} 65%, ${backgroundColor} 100%)`,
    backgroundSize: "200% 100%",
    animation: "lli-skeleton-shimmer 1200ms ease-in-out infinite",
  };

  const pulseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: backgroundColor,
    animation: "lli-skeleton-pulse 1200ms ease-in-out infinite",
  };

  return (
    <div style={base}>
      <div style={type === "shimmer" ? shimmerStyle : pulseStyle} />
    </div>
  );
}
