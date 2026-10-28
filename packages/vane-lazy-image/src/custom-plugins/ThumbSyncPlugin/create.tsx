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
        // 注意：缩略条的整体排列方向（横向/纵向）由 GalleryCore 的 thumbStyle
        // 控制（top/bottom 横向、left/right 纵向）。此处不再包一层写死的横向
        // flex，否则 left/right 竖排容器（宽 84）里 6 个 64px 缩略图会被横向
        // 裁切只剩 1 个。直接返回 button 列表，方向交给外层 thumbStyle + 其 gap。
        return (
          <>
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
          </>
        );
      },
    },
  };
}

export default createThumbSyncPlugin;
