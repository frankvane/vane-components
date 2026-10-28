/**
 * ZoomControlPlugin —— 按钮式缩放控制（gallery 增强插件）。
 *
 * 在 galleryToolbarArea 渲染 − / 重置 / + 按钮，调整 context.zoom。
 * GalleryCore 读取 context.zoom 对主图区施加 scale 变换（zoom>1 时主图区可滚动查看），
 * 因此本插件切换 zoom 即实时改变主图缩放——无需手动 forceUpdate（zoom 是 useState 协调态）。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface ZoomControlConfig {
  /** 每步缩放增量 */
  step?: number;
  /** 最小缩放 */
  min?: number;
  /** 最大缩放 */
  max?: number;
}

export function createZoomControlPlugin(config: ZoomControlConfig = {}): GalleryPlugin {
  const { step = 0.5, min = 1, max = 4 } = config;
  const clamp = (z: number) => Math.min(max, Math.max(min, z));

  return {
    name: "gallery-zoom-control",
    version: "1.0.0",
    config,
    hooks: {
      galleryToolbarArea: (context: GalleryContext) => {
        const { zoom, setZoom } = context;
        const btn: React.CSSProperties = {
          border: "1px solid #ddd",
          background: "#fff",
          borderRadius: 6,
          width: 30,
          height: 28,
          cursor: "pointer",
          fontSize: 15,
          lineHeight: "1",
          color: "#333",
          userSelect: "none",
        };
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              aria-label="缩小"
              disabled={zoom <= min}
              onClick={() => setZoom(clamp(zoom - step))}
              style={{ ...btn, opacity: zoom <= min ? 0.4 : 1 }}
            >
              −
            </button>
            <button
              type="button"
              aria-label="重置缩放"
              onClick={() => setZoom(1)}
              style={{ ...btn, width: 52, fontSize: 12 }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="放大"
              disabled={zoom >= max}
              onClick={() => setZoom(clamp(zoom + step))}
              style={{ ...btn, opacity: zoom >= max ? 0.4 : 1 }}
            >
              +
            </button>
          </div>
        );
      },
    },
  };
}

export default createZoomControlPlugin;
