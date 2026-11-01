import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface RateLimitConfig {
  /** 单用户在 window 秒内最多保留的弹幕数，默认 3 */
  max?: number;
  /** 统计窗口（秒），默认 10 */
  window?: number;
}

/**
 * RateLimitPlugin —— 单用户限流（数据面）。
 * 单用户在 window 秒内超过 max 条的弹幕被丢弃，防止单一用户刷屏压垮轨道。
 * 纯函数：按 item.time 顺序累计同用户窗口内计数。
 */
export function createRateLimitPlugin(
  config: RateLimitConfig = {}
): DanmakuPlugin {
  const max = config.max ?? 3;
  const win = config.window ?? 10;

  return {
    name: "rate-limit",
    version: "0.1.0",
    description: doc.description,
    priority: 15,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const timesByUser = new Map<string, number[]>();
        const items = [];
        for (const it of data.items) {
          const uid = it.meta.userId ?? "";
          const arr = timesByUser.get(uid) ?? [];
          const within = arr.filter((t) => it.time - t <= win);
          if (within.length >= max) continue;
          within.push(it.time);
          timesByUser.set(uid, within);
          items.push(it);
        }
        return { ...data, items };
      },
    },
  };
}

createRateLimitPlugin.meta = doc as PluginDoc;
