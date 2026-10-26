import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface FadeInConfig {
  durationMs?: number;
  easing?: string;
}

export function createFadeInPlugin(config: FadeInConfig = {}): LazyImagePlugin {
  const { durationMs = 400, easing = "ease" } = config;
  return {
    name: "fade-in",
    version: "1.0.0",
    config,
    hooks: {
      onMount: (context: LazyImageContext) => {
        // 内核在 onMount 阶段通常还没渲染出 <img>（displaySrc 尚未就绪），
        // 直接读 imageRef 会拿到 null 并静默失效，这里用 rAF 重试若干帧。
        let tries = 0;
        const start = () => {
          const img = context.imageRef?.current;
          if (!img) {
            if (tries++ < 60) requestAnimationFrame(start);
            return;
          }
          try {
            img.style.opacity = "0";
            img.style.transition = `opacity ${durationMs}ms ${easing}`;
          } catch {}
        };
        start();
      },
      onLoadSuccess: (context: LazyImageContext) => {
        const img = context.imageRef?.current;
        if (!img) return;
        try {
          img.style.opacity = "1";
        } catch {}
      },
    },
  };
}