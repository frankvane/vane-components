import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface CDNFallbackConfig {
  cdnBases: string[]; // e.g. ["https://cdn1.example.com", "https://cdn2.example.com"]
  /**
   * P0-3：总尝试次数上限（含首次原始地址请求），默认 `cdnBases.length + 1`
   * （即「原始地址 + 每个 CDN 各一次」）。达到上限后不再改写 img.src，错误继续传播。
   */
  maxAttempts?: number;
  /**
   * P0-3：是否为回退地址追加 `cdnFallback=<n>` 查询参数。
   * 默认 false —— 旧实现使用 `Date.now()` 会击穿 CDN / 浏览器缓存。
   */
  cacheBust?: boolean;
}

const ATTEMPTS_KEY = "cdn-attempts";
const INDEX_KEY = "cdn-index";

function swapBase(originalSrc: string, base: string): string {
  try {
    const u = new URL(originalSrc, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const newBase = new URL(base);
    u.protocol = newBase.protocol;
    u.hostname = newBase.hostname;
    u.port = newBase.port;
    return u.toString();
  } catch {
    return originalSrc;
  }
}

export function createCDNFallbackPlugin(config: CDNFallbackConfig): LazyImagePlugin {
  const bases = config.cdnBases || [];
  const maxAttempts = Math.max(1, config.maxAttempts ?? bases.length + 1);
  const cacheBust = config.cacheBust ?? false;

  return {
    name: "cdn-fallback",
    version: "1.1.0",
    description: "原始地址加载失败后按顺序回退到 CDN，带尝试次数上限（P0-3）",
    config,
    hooks: {
      onLoadError: (context: LazyImageContext) => {
        if (!bases.length) return false;

        const prev = Number(context.sharedData?.get(ATTEMPTS_KEY) ?? 0);
        const next = prev + 1;
        try {
          context.sharedData?.set(ATTEMPTS_KEY, next);
        } catch {}

        // P0-3：原始地址 + 全部 CDN 都失败后终止，返回 false 让错误继续传播。
        if (next >= maxAttempts) {
          return false;
        }

        const index = (next - 1) % bases.length;
        try {
          context.sharedData?.set(INDEX_KEY, index);
        } catch {}

        const img = context.imageRef?.current;
        if (img) {
          const altSrc = swapBase(context.src, bases[index]);
          const finalSrc = cacheBust
            ? `${altSrc}${altSrc.includes("?") ? "&" : "?"}cdnFallback=${next}`
            : altSrc;
          try {
            img.src = finalSrc;
          } catch {}
        }
        return true;
      },
      // P0-3：换图后尝试次数必须归零，否则新图第一次失败就被判定为「重试用尽」。
      onSrcChange: (context: LazyImageContext, _oldSrc: string) => {
        try {
          context.sharedData?.set(ATTEMPTS_KEY, 0);
          context.sharedData?.set(INDEX_KEY, 0);
        } catch {}
      },
      onUnmount: (context: LazyImageContext) => {
        try {
          context.sharedData?.set(ATTEMPTS_KEY, 0);
          context.sharedData?.set(INDEX_KEY, 0);
        } catch {}
      },
    },
  };
}
