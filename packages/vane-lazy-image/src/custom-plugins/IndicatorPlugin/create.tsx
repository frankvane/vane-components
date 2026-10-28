/**
 * IndicatorPlugin —— 圆点指示器（gallery 增强插件）。
 *
 * 在 galleryToolbarArea 渲染圆点，点击第 N 点 → context.setActiveIndex(N)。
 * 与 ThumbSync 缩略条互补：缩略条看缩略图、圆点看位置进度。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface IndicatorConfig {
  /** 圆点直径（px） */
  size?: number;
  /** 圆点间距（px） */
  gap?: number;
  /** 选中色 */
  activeColor?: string;
  /** 未选中色 */
  idleColor?: string;
}

export function createIndicatorPlugin(config: IndicatorConfig = {}): GalleryPlugin {
  const {
    size = 8,
    gap = 6,
    activeColor = "#2b7de9",
    idleColor = "rgba(0,0,0,0.25)",
  } = config;
  return {
    name: "gallery-indicator",
    version: "1.0.0",
    config,
    hooks: {
      galleryToolbarArea: (context: GalleryContext) => {
        const { images, activeIndex, setActiveIndex } = context;
        return (
          <div
            style={{
              display: "flex",
              gap,
              alignItems: "center",
              padding: "2px 4px",
            }}
          >
            {images.map((_, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`跳到第 ${i + 1} 张`}
                  aria-current={active}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    width: size,
                    height: size,
                    padding: 0,
                    margin: 0,
                    border: "none",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: active ? activeColor : idleColor,
                    transition: "background 120ms ease",
                  }}
                />
              );
            })}
          </div>
        );
      },
    },
  };
}

export default createIndicatorPlugin;
