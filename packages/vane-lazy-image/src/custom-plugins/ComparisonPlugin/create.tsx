import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import React from "react";

export interface ComparisonConfig {
  /** 对比图：拖动前（左）显示的图片 */
  beforeSrc?: string;
  /** 对比图：拖动后（右）显示的图片；默认用主图 src */
  afterSrc?: string;
  /** 左图标签 */
  labelBefore?: string;
  /** 右图标签 */
  labelAfter?: string;
  /** 初始分割位置（0~1，默认 0.5） */
  start?: number;
}

/**
 * 前后对比插件（v2 真实实现）：用可拖拽分隔条对比 beforeSrc / afterSrc 两张图，
 * 替换旧版仅渲染写死文字角标的占位实现。拖动分隔条实时比较两图差异。
 */
export function createComparisonPlugin(config: ComparisonConfig = {}): LazyImagePlugin {
  const { beforeSrc, afterSrc, labelBefore = "前", labelAfter = "后", start = 0.5 } = config;

  const Overlay: React.FC<{ context: LazyImageContext }> = ({ context }) => {
    const [pos, setPos] = React.useState(Math.min(1, Math.max(0, start)));
    const ref = React.useRef<HTMLDivElement | null>(null);
    const dragging = React.useRef(false);

    const updateFromClientX = React.useCallback((clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const p = (clientX - rect.left) / rect.width;
      setPos(Math.min(1, Math.max(0, p)));
    }, []);

    const onDown = (e: React.PointerEvent) => {
      dragging.current = true;
      try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch {}
      updateFromClientX(e.clientX);
    };
    const onMove = (e: React.PointerEvent) => {
      if (!dragging.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = (e: React.PointerEvent) => {
      dragging.current = false;
      try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
    };

    const before = beforeSrc ?? context.src;
    const after = afterSrc ?? context.src;
    const safePos = Math.max(0.0001, pos);

    const labelStyle: React.CSSProperties = {
      position: "absolute",
      top: 8,
      padding: "2px 8px",
      background: "rgba(0,0,0,0.55)",
      color: "#fff",
      fontSize: 12,
      borderRadius: 4,
      pointerEvents: "none",
      zIndex: 3,
    };

    return (
      <div
        ref={ref}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          cursor: "ew-resize",
          touchAction: "none",
          userSelect: "none",
          zIndex: 4,
        }}
        title="拖动对比"
      >
        {/* 右图（底图） */}
        <img
          src={after}
          alt={labelAfter}
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* 左图（按分割位置裁剪） */}
        <div style={{ position: "absolute", inset: 0, width: `${pos * 100}%`, overflow: "hidden" }}>
          <img
            src={before}
            alt={labelBefore}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              // 让左图始终等于容器宽度：width = 容器 / pos
              width: `${100 / safePos}%`,
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        {/* 分割线 + 把手 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${pos * 100}%`,
            width: 2,
            background: "#fff",
            transform: "translateX(-1px)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "#fff",
              color: "#333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            ⇆
          </div>
        </div>
        <div style={{ ...labelStyle, left: 8 }}>{labelBefore}</div>
        <div style={{ ...labelStyle, right: 8 }}>{labelAfter}</div>
      </div>
    );
  };

  return {
    name: "comparison",
    version: "2.0.0",
    config,
    hooks: {
      renderOverlay: (context) => <Overlay context={context} />,
    },
  };
}
