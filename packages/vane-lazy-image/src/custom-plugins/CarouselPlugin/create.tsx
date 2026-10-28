/**
 * CarouselPlugin —— 自动轮播（gallery 增强插件）。
 *
 * 在 galleryToolbarArea 渲染 播放/暂停 按钮；播放时按 interval 自动切换主图
 * （context.setActiveIndex，循环到末尾回第 1 张）。pauseOnHover 时悬停图集根容器暂停。
 * 与缩略联动/指示点共用 activeIndex 协调态，自动轮播时它们同步刷新。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface CarouselConfig {
  /** 每帧停留时长（ms） */
  interval?: number;
  /** 初始是否自动播放 */
  autoStart?: boolean;
  /** 悬停图集根容器时暂停 */
  pauseOnHover?: boolean;
}

export function createCarouselPlugin(config: CarouselConfig = {}): GalleryPlugin {
  const { interval = 3000, autoStart = false, pauseOnHover = true } = config;

  const Carousel: React.FC<{ context: GalleryContext }> = ({ context }) => {
    const { activeIndex, setActiveIndex, images } = context;
    const len = images.length;
    const [playing, setPlaying] = React.useState(autoStart && len > 1);
    const [hovering, setHovering] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);

    // 悬停图集根容器时暂停（pauseOnHover）
    React.useEffect(() => {
      if (!pauseOnHover) return;
      const root = btnRef.current?.closest("[data-gallery-root]");
      if (!root) return;
      const enter = () => setHovering(true);
      const leave = () => setHovering(false);
      root.addEventListener("mouseenter", enter);
      root.addEventListener("mouseleave", leave);
      return () => {
        root.removeEventListener("mouseenter", enter);
        root.removeEventListener("mouseleave", leave);
      };
    }, [pauseOnHover]);

    // 自动推进：playing 且未悬停时，每 interval 推进一帧（activeIndex 变化即重置计时）
    React.useEffect(() => {
      if (!playing || hovering || len < 2) return;
      const id = window.setTimeout(() => {
        setActiveIndex((activeIndex + 1) % len);
      }, interval);
      return () => window.clearTimeout(id);
    }, [playing, hovering, activeIndex, len, interval, setActiveIndex]);

    if (len < 2) return null;

    return (
      <button
        ref={btnRef}
        type="button"
        aria-label={playing ? "暂停轮播" : "开始轮播"}
        aria-pressed={playing}
        onClick={() => setPlaying((p) => !p)}
        style={{
          border: "1px solid #ddd",
          background: "#fff",
          borderRadius: 6,
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 13,
          color: "#333",
          userSelect: "none",
        }}
      >
        {playing ? "⏸ 暂停" : "▶ 轮播"}
      </button>
    );
  };

  return {
    name: "gallery-carousel",
    version: "1.0.0",
    config,
    hooks: {
      galleryToolbarArea: (context: GalleryContext) => <Carousel context={context} />,
    },
  };
}

export default createCarouselPlugin;
