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
        const img = context.imageRef?.current;
        if (!img) return;
        try {
          img.style.opacity = "0";
          img.style.transition = `opacity ${durationMs}ms ${easing}`;
        } catch {}
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