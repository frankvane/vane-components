/**
 * ThumbSyncPlugin —— 缩略图联动（gallery 核心插件）。
 *
 * 在 galleryThumbArea 渲染缩略图条；点击缩略图 → context.setActiveIndex(i)。
 * activeIndex 由 useGalleryRuntime 用 useState 持有，变更即 GalleryCore 重渲染，
 * 主图随之切换、计数/指示点同步——这是规划 chips 中的 ThumbSync。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface ThumbSyncConfig {
  /** 缩略图间距（px） */
  gap?: number;
  /** 缩略图宽（px） */
  thumbWidth?: number;
  /** 缩略图高（px） */
  thumbHeight?: number;
  /** 选中态描边 */
  showActiveRing?: boolean;
  /** 缩略图圆角（px） */
  radius?: number;
}

export function createThumbSyncPlugin(config: ThumbSyncConfig = {}): GalleryPlugin {
  const {
    gap = 8,
    thumbWidth = 64,
    thumbHeight = 64,
    showActiveRing = true,
    radius = 6,
  } = config;

  return {
    name: "gallery-thumb-sync",
    version: "1.0.0",
    config,
    hooks: {
      galleryThumbArea: (context: GalleryContext) => {
        const { images, activeIndex, setActiveIndex } = context;
        return (
          <div style={{ display: "flex", gap, alignItems: "center" }}>
            {images.map((img, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`第 ${i + 1} 张`}
                  aria-current={active}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    padding: 0,
                    margin: 0,
                    border:
                      active && showActiveRing
                        ? "2px solid #2b7de9"
                        : "2px solid transparent",
                    borderRadius: radius,
                    overflow: "hidden",
                    cursor: "pointer",
                    width: thumbWidth,
                    height: thumbHeight,
                    background: "#eee",
                    transition: "border-color 120ms ease",
                    flex: "0 0 auto",
                  }}
                >
                  <img
                    src={img.thumbnail ?? img.src}
                    alt={img.alt ?? `图 ${i + 1}`}
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </button>
              );
            })}
          </div>
        );
      },
    },
  };
}

export default createThumbSyncPlugin;
