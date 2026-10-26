import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface ViewportDwellConfig {
  /** 需要在视口中连续停留的时间（毫秒），不足则视为「划过」不加载 */
  dwellMs?: number;
  /** 最长等待时间（毫秒）：避免滚动过快导致一直饥饿，到时仍可加载 */
  maxWaitMs?: number;
  /** 仅在进入视口时生效门控；离开且未达上限则中止加载 */
  onlyWhenIntersecting?: boolean;
  debug?: boolean;
}

/**
 * 视口驻留门控插件（v2 真实实现）：
 * - onEnterViewport / onLeaveViewport 把实时在视口状态写入 sharedData；
 * - onBeforeLoad（引擎门控钩子）轮询：累计停留达到 dwellMs 才放行加载；
 *   若期间离开视口且未达 maxWaitMs，则返回 false 中止本次加载，避免为「一闪而过」的图片浪费带宽。
 */
export function createViewportDwellPlugin(config: ViewportDwellConfig = {}): LazyImagePlugin {
  const {
    dwellMs = 250,
    maxWaitMs = 1500,
    onlyWhenIntersecting = true,
    debug = false,
  } = config;

  const INVIEW = "viewport-dwell:inView";

  return {
    name: "viewport-dwell",
    version: "2.0.0",
    config,
    hooks: {
      onEnterViewport: (context: LazyImageContext) => {
        try { context.sharedData?.set(INVIEW, true); } catch {}
        if (debug) {
          try { console.debug("[ViewportDwell] enter", context.src); } catch {}
        }
      },
      onLeaveViewport: (context: LazyImageContext) => {
        try { context.sharedData?.set(INVIEW, false); } catch {}
        if (debug) {
          try { console.debug("[ViewportDwell] leave", context.src); } catch {}
        }
      },
      // 门控：累计停留达到 dwellMs 才放行；离开且未达 maxWait 则中止
      onBeforeLoad: async (context: LazyImageContext) => {
        const start = Date.now();
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        if (debug) {
          try { console.debug("[ViewportDwell] gating", { src: context.src, dwellMs, maxWaitMs }); } catch {}
        }
        while (true) {
          const inView = !!context.sharedData?.get(INVIEW);
          const elapsed = Date.now() - start;
          if (!inView && onlyWhenIntersecting && elapsed < maxWaitMs) {
            if (debug) {
              try { console.debug("[ViewportDwell] aborted (left before dwell)", context.src); } catch {}
            }
            return false; // 中止本次加载
          }
          if (elapsed >= dwellMs) {
            if (debug) {
              try { console.debug("[ViewportDwell] proceed", context.src, { elapsed }); } catch {}
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
