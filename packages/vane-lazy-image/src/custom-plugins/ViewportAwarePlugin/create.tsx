import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import React from "react";

export interface ViewportAwareConfig {
  /**
   * 视口感知加载的核心：把 IntersectionObserver 的 rootMargin 真正下发给 Core，
   * 控制「提前 / 延后」多少距离才触发加载。例如 "200px" 表示元素进入视口前 200px
   * 就开始加载（预加载），"0px" 表示严格进入才加载。
   */
  rootMargin?: string;
  /** IO 触发阈值（0~1 或数组），控制加载灵敏度 */
  threshold?: number | number[];
  /**
   * 是否「只加载一次」：true（默认）= 进入视口加载后停止观察（省资源）；
   * false = 持续观察，离开再回来可重新判定（配合 threshold 做精细控制）。
   */
  once?: boolean;
  /** 是否把 unobserveOnVisible 显式下发（优先于 once） */
  unobserveOnVisible?: boolean;
  // ---- 可视化指示（非核心能力，仅辅助观察） ----
  showDot?: boolean;
  dotPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  hideWhenOut?: boolean;
}

function Dot({ context, cfg }: { context: LazyImageContext; cfg: ViewportAwareConfig }) {
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

export function createViewportAwarePlugin(config: ViewportAwareConfig = {}): LazyImagePlugin {
  const { rootMargin, threshold, once, unobserveOnVisible, showDot, dotPosition, hideWhenOut } = config;

  // 解析 unobserveOnVisible：once 优先；否则显式 unobserveOnVisible；再否则交给 Core 默认
  const resolvedUnobserve =
    once !== undefined ? once : unobserveOnVisible;

  return {
    name: "viewport-aware",
    version: "2.0.0",
    config,
    hooks: {
      // 真正下发给 Core 的 IO 配置 —— 这是「视口感知加载」的核心实现
      transformProps: (props) => ({
        ...props,
        ...(rootMargin !== undefined ? { rootMargin } : null),
        ...(threshold !== undefined ? { threshold } : null),
        ...(resolvedUnobserve !== undefined ? { unobserveOnVisible: resolvedUnobserve } : null),
      }),
      renderOverlay: (context) => (
        <Dot context={context} cfg={{ showDot, dotPosition, hideWhenOut }} />
      ),
      onEnterViewport: (context) => {
        try { (context.imageRef?.current as any)?.setAttribute("data-in-view", "1"); } catch {}
      },
      onLeaveViewport: (context) => {
        try { (context.imageRef?.current as any)?.setAttribute("data-in-view", "0"); } catch {}
      },
    },
  };
}
