import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface ViewportDebounceConfig {
  /** 进入视口后需「稳定停留」的时长（毫秒），期间若离开则重新计时/中止 */
  debounceMs?: number;
  /** 最长等待上限（毫秒）：避免快速来回导致一直不加载（饥饿） */
  maxWaitMs?: number;
  /** 仅在进入视口时应用去抖门控；离开且未达上限则中止本次加载 */
  onlyWhenIntersecting?: boolean;
  debug?: boolean;
}

/**
 * 视口防抖插件（v2 真实实现）：
 * - onEnterViewport / onLeaveViewport 把实时在视口状态写入 sharedData；
 * - onBeforeLoad（引擎门控钩子）轮询直到元素「稳定停留 debounceMs」才放行加载；
 *   若期间离开视口且未达 maxWaitMs，则返回 false 中止本次加载，避免快速滚动误加载。
 */
export function createViewportDebouncePlugin(config: ViewportDebounceConfig = {}): LazyImagePlugin {
  const { debounceMs = 200, maxWaitMs = 1200, onlyWhenIntersecting = true, debug = false } = config;

  const INVIEW = "viewport-debounce:inView";

  return {
    name: "viewport-debounce",
    version: "2.0.0",
    config,
    hooks: {
      onEnterViewport: (context: LazyImageContext) => {
        try { context.sharedData?.set(INVIEW, true); } catch {}
        if (debug) {
          try { console.debug("[ViewportDebounce] enter", context.src); } catch {}
        }
      },
      onLeaveViewport: (context: LazyImageContext) => {
        try { context.sharedData?.set(INVIEW, false); } catch {}
        if (debug) {
          try { console.debug("[ViewportDebounce] leave", context.src); } catch {}
        }
      },
      // 门控：延迟到稳定后才放行；离开且未达上限则中止
      onBeforeLoad: async (context: LazyImageContext) => {
        const start = Date.now();
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        while (true) {
          const inView = !!context.sharedData?.get(INVIEW);
          const elapsed = Date.now() - start;
          if (!inView && onlyWhenIntersecting && elapsed < maxWaitMs) {
            if (debug) {
              try { console.debug("[ViewportDebounce] aborted (left before stable)", context.src); } catch {}
            }
            return false; // 中止本次加载
          }
          if (elapsed >= debounceMs) {
            if (debug) {
              try { console.debug("[ViewportDebounce] stable, proceed", context.src, { elapsed }); } catch {}
            }
            return true; // 放行
          }
          await sleep(30);
        }
      },
      onUnmount: (context: LazyImageContext) => {
        try { context.sharedData?.delete(INVIEW); } catch {}
      },
    },
  };
}
