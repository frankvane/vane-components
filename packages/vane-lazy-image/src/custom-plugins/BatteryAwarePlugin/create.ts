import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";
import type { LazyLoadImageCoreProps } from "../../components/LazyLoadImagePlugin/LazyLoadImageCore";

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<{ level: number }>;
};

export interface BatteryAwareConfig {
  enabled?: boolean;
  lowBatteryThreshold?: number; // 0-1
  downgradeWidth?: number;
  disablePreconnect?: boolean;
}

async function getBatteryLevel(): Promise<number | null> {
  try {
    const nav: NavigatorWithBattery | undefined =
      typeof navigator !== "undefined" ? (navigator as NavigatorWithBattery) : undefined;
    if (nav && typeof nav.getBattery === "function") {
      const battery = await nav.getBattery();
      return battery?.level ?? null;
    }
  } catch {}
  return null;
}

function rewriteWidth(src: string, width: number): string {
  try {
    const u = new URL(src, window.location.href);
    u.searchParams.set("w", String(width));
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return src;
  }
}

function shouldSaveData(ctx: LazyImageContext): boolean {
  return Boolean(ctx.networkInfo?.saveData);
}

export function createBatteryAwarePlugin(
  config: BatteryAwareConfig = {}
): LazyImagePlugin {
  const {
    enabled = true,
    lowBatteryThreshold = 0.2,
    downgradeWidth = 640,
    disablePreconnect = true,
  } = config;

  return {
    name: "battery-aware",
    version: "1.0.0",
    config,
    hooks: {
      onLoad: async (ctx) => {
        if (!enabled) return undefined;
        const level = await getBatteryLevel();
        const lowBattery = level !== null ? level <= lowBatteryThreshold : false;
        const saveData = shouldSaveData(ctx);
        if (lowBattery || saveData) {
          return rewriteWidth(ctx.src, downgradeWidth);
        }
        return undefined;
      },
      transformProps: (props) => {
        if (!enabled) return props;
        const next: LazyLoadImageCoreProps & { "data-disable-preconnect"?: string } = { ...props };
        next.loading = "lazy";
        if (disablePreconnect) {
          // 通过自定义属性标记，供 PreconnectPlugin 读取后跳过
          next["data-disable-preconnect"] = "true";
        }
        return next;
      },
    },
  } as LazyImagePlugin;
}