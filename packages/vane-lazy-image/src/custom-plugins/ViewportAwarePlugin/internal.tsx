/**
 * ViewportAwarePlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import type React from "react";

import type { LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import type { ViewportAwareConfig } from "./create";

export function Dot({ context, cfg }: { context: LazyImageContext; cfg: ViewportAwareConfig }) {
  if (!cfg.showDot) return null;
  if (cfg.hideWhenOut && !context.isIntersecting) return null;
  const pos = cfg.dotPosition ?? "bottom-right";
  const style: React.CSSProperties = {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 999,
    background: context.isIntersecting ? "#28a745" : "#6c757d",
    zIndex: 10,
  };
  if (pos.includes("top")) style.top = 6; else style.bottom = 6;
  if (pos.includes("left")) style.left = 6; else style.right = 6;
  return <div style={style} title={context.isIntersecting ? "in-view" : "out-of-view"} />;
}
