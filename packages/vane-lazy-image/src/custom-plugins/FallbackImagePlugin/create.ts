import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface FallbackImageConfig {
  fallbackSrc: string; // 例如 "/404.jpg"
}

export function createFallbackImagePlugin(config: FallbackImageConfig): LazyImagePlugin {
  const { fallbackSrc } = config;
  return {
    name: "fallback-image",
    version: "1.1.0",
    description: "失败后回退到占位图；每个 src 只回退一次，避免回退图自身失败导致死循环（P0-2）",
    config,
    hooks: {
      onLoadError: (context: LazyImageContext, _error: Error | Event) => {
        // 记录发生过错误，供 ErrorBadge 等组件在回退成功后仍可显示
        try { context.sharedData?.set("had-error", true); } catch {}

        // P0-2：回退图自身也可能失败（Core 在 error 态会继续上报回退地址的失败），
        // 每个 src 只回退一次，第二次直接放行错误传播，避免无限改写 img.src。
        const key = `fallback-applied:${context.src}`;
        if (context.sharedData?.get(key)) {
          return false;
        }
        try { context.sharedData?.set(key, true); } catch {}

        const img = context.imageRef?.current;
        if (!img) return true;
        try {
          img.src = fallbackSrc;
        } catch {}
        return true;
      },
    },
  };
}