import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface MemoryPressureAbortConfig {
  enabled?: boolean;
  /** 设备内存<=该阈值时启用降质（GB） */
  deviceMemoryThreshold?: number;
  /** 移动端或省流模式时强制启用降质 */
  preferOnMobile?: boolean;
  /** 重写到低清晰度：针对常见图片域名的宽度参数 */
  lowWidth?: number;
  /** 离开视口且仍在加载时，是否中止在途加载（调用 context.reset 取消元素加载） */
  abortOnLeave?: boolean;
}

function rewriteToLowQuality(src: string, width: number): string {
  try {
    const url = new URL(src, window.location.href);
    const host = url.host;
    const params = url.searchParams;
    if (/images\.unsplash\.com$/i.test(host)) {
      params.set("w", String(width));
      params.set("auto", "format");
      params.set("fit", "crop");
      url.search = params.toString();
      return url.toString();
    }
    if (/img\d+\.360buyimg\.com$/i.test(host)) {
      params.set("w", String(width));
      params.set("auto", "format");
      params.set("fit", "crop");
      url.search = params.toString();
      return url.toString();
    }
    if (!url.search || url.search === "") {
      url.search = `?w=${width}&auto=format&fit=crop`;
    }
    return url.toString();
  } catch {
    return src;
  }
}

export function createMemoryPressureAbortPlugin(
  config: MemoryPressureAbortConfig = {}
): LazyImagePlugin {
  const {
    enabled = true,
    deviceMemoryThreshold = 4,
    preferOnMobile = true,
    lowWidth = 640,
    abortOnLeave = true,
  } = config;

  const shouldDowngrade = (ctx: LazyImageContext): boolean => {
    const nav: any = typeof navigator !== "undefined" ? navigator : undefined;
    const deviceMemory = Number(nav?.deviceMemory || 8);
    const isMobile = ctx.deviceInfo?.type === "mobile";
    const saveData = Boolean(ctx.networkInfo?.saveData);
    return (
      (deviceMemory && deviceMemory <= deviceMemoryThreshold) ||
      (preferOnMobile && isMobile) ||
      saveData
    );
  };

  return {
    name: "memory-pressure-abort",
    version: "2.0.0",
    config,
    hooks: {
      // 真实降质：低内存 / 移动端 / 省流时把 src 改写为低清版本
      onLoad: (context) => {
        if (!enabled) return undefined;
        if (!shouldDowngrade(context)) return undefined;
        return rewriteToLowQuality(context.src, lowWidth);
      },
      // 真实中止：离开视口且仍在加载时，调用 context.reset() 取消元素在途加载
      onLeaveViewport: (context) => {
        if (!enabled || !abortOnLeave) return;
        const st = context.imageState;
        if (st && st.isLoading) {
          try {
            context.reset?.();
          } catch {}
        }
      },
    },
  };
}
