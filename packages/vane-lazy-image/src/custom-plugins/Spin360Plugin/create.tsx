/**
 * Spin360Plugin —— 360° 环物旋转（gallery 核心插件）。
 *
 * 在 galleryOverlay 渲染一层覆盖主图的 360 画布：把 images 当作逐帧序列，
 * 拖拽/自动播放切换 frameIndex，经 context.setFrameIndex 更新。这是规划 chips
 * 中的 Spin360。点击拖拽在画布内完成，不影响底层主图加载。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface Spin360Config {
  /** 拖拽灵敏度：像素位移超过该值才翻一帧 */
  sensitivity?: number;
  /** 自动旋转 */
  autoPlay?: boolean;
  /** 自动旋转间隔（ms） */
  autoPlayInterval?: number;
}

export function createSpin360Plugin(config: Spin360Config = {}): GalleryPlugin {
  const { sensitivity = 6, autoPlay = false, autoPlayInterval = 120 } = config;

  const Spin360: React.FC<{ context: GalleryContext }> = ({ context }) => {
    const { images, frameIndex, setFrameIndex } = context;
    const count = images.length;
    const dragging = React.useRef(false);
    const lastX = React.useRef(0);

    React.useEffect(() => {
      if (!autoPlay || count < 2) return;
      const id = window.setInterval(() => {
        setFrameIndex((frameIndex + 1) % count);
      }, autoPlayInterval);
      return () => window.clearInterval(id);
      // frameIndex 进依赖：每次翻帧后重设定时器，保证连续
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, autoPlayInterval, count, frameIndex, setFrameIndex]);

    const onDown = (e: React.PointerEvent) => {
      dragging.current = true;
      lastX.current = e.clientX;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const onMove = (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      if (Math.abs(dx) > sensitivity) {
        const step = dx > 0 ? 1 : -1;
        setFrameIndex((frameIndex + step + count) % count);
        lastX.current = e.clientX;
      }
    };
    const onUp = () => {
      dragging.current = false;
    };

    if (count < 2) return null;
    const frame = images[((frameIndex % count) + count) % count];

    return (
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "ew-resize",
          touchAction: "none",
          userSelect: "none",
          zIndex: 5,
          background: "transparent",
        }}
        title="拖拽旋转 360°"
      >
        <img
          src={frame.src}
          alt={frame.alt ?? "360 视图"}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 4,
            pointerEvents: "none",
          }}
        >
          360° · {frameIndex + 1}/{count}
        </div>
      </div>
    );
  };

  return {
    name: "gallery-spin-360",
    version: "1.0.0",
    config,
    hooks: {
      galleryOverlay: (context: GalleryContext) => <Spin360 context={context} />,
    },
  };
}

export default createSpin360Plugin;
