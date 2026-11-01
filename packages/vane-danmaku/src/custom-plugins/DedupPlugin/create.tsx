import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface DedupConfig {
  /** 同一用户+相同文案在多少秒内再次出现则去重，默认 5 */
  window?: number;
}

/**
 * DedupPlugin —— 弹幕去重（数据面）。
 * 同一用户、相同文案在 window 秒内重复出现时只保留首条，避免刷屏。
 * 纯函数：基于 item.time 顺序判断，transformData 多次调用结果稳定。
 */
export function createDedupPlugin(config: DedupConfig = {}): DanmakuPlugin {
  const win = config.window ?? 5;

  return {
    name: "dedup",
    version: "0.1.0",
    description: doc.description,
    priority: 14,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const seen = new Map<string, number>();
        const items = [];
        for (const it of data.items) {
          const key = `${it.meta.userId ?? ""} ${it.text}`;
          const last = seen.get(key);
          if (last != null && it.time - last <= win) continue;
          seen.set(key, it.time);
          items.push(it);
        }
        return { ...data, items };
      },
    },
  };
}

createDedupPlugin.meta = doc as PluginDoc;
