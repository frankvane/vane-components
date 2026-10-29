import React from "react";
import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface ColorExtractionConfig {
  setContainerBg?: boolean; // 是否设置容器背景为主色
  sampleSize?: number; // 采样步长（像素），越大越快但越不精确
  showOverlay?: boolean; // 在图片右上角显示主色卡
}

function computeDominantColor(img: HTMLImageElement, sampleSize = 4): string | null {
  try {
    const canvas = document.createElement("canvas");
    const w = Math.min(img.naturalWidth || img.width, 256);
    const h = Math.min(img.naturalHeight || img.height, 256);
    if (!w || !h) return null;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    // 采样步长必须是 ≥1 的整数：sampleSize 传 0 / 负数 / NaN 时，
    // 旧实现 `i += 4 * sampleSize` 步长为 0 会直接死循环，把整个渲染进程卡死。
    const stride = Math.max(1, Math.floor(Number(sampleSize)) || 1);
    let r = 0,
      g = 0,
      b = 0,
      count = 0;
    for (let y = 0; y < h; y += stride) {
      for (let x = 0; x < w; x += stride) {
        const i = (y * w + x) * 4;
        if (data[i + 3] === 0) continue; // 跳过全透明像素
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
    if (!count) return null;
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

export function createColorExtractionPlugin(config: ColorExtractionConfig = {}): LazyImagePlugin {
  const { setContainerBg = true, sampleSize = 4, showOverlay = true } = config;
  return {
    name: "color-extraction",
    version: "1.0.0",
    config,
    hooks: {
      // 确保在加载前为 <img> 设置跨域策略
      transformProps: (props) => {
        return { ...props, crossOrigin: "anonymous" } as any;
      },
      onMount: (context: LazyImageContext) => {
        // 尝试启用跨域像素访问
        try { context.imageRef?.current?.setAttribute("crossOrigin", "anonymous"); } catch {}
      },
      onLoadSuccess: (context: LazyImageContext) => {
        const img = context.imageRef?.current as HTMLImageElement | null;
        if (!img) return;
        const color = computeDominantColor(img, sampleSize);
        if (setContainerBg && color) {
          try {
            const container = context.containerRef?.current as HTMLElement | null;
            if (container) {
              // 使用渐变增强可感知性
              container.style.background = `linear-gradient(90deg, ${color} 0%, rgba(0,0,0,0.06) 100%)`;
            }
          } catch {}
        }
        try { context.sharedData?.set("dominant-color", color); } catch {}
        try { (img as any).__lliDominantColor = color; } catch {}
      },
      renderOverlay: (context: LazyImageContext) => {
        if (!showOverlay) return null;
        const Overlay: React.FC = () => {
          const [color, setColor] = React.useState<string | null>(null);
          React.useEffect(() => {
            let alive = true;
            const tick = () => {
              if (!alive) return;
              const img = context.imageRef?.current as any;
              const c = img?.__lliDominantColor || context.sharedData?.get("dominant-color") || null;
              setColor(c || null);
            };
            const raf = requestAnimationFrame(tick);
            return () => {
              alive = false;
              cancelAnimationFrame(raf);
            };
          }, [context]);

          const style: React.CSSProperties = {
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 12,
            padding: "6px 8px",
            borderRadius: 6,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          };
          return (
            <div style={style}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: color || "transparent",
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              />
              <span>{color ? color : "未提取"}</span>
            </div>
          );
        };
        return <Overlay />;
      },
    },
  };
}