import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface SpeedControlConfig {
  /** 飞行时长系数：>1 更慢（更易读），<1 更快，默认 1 */
  factor?: number;
  /** 飞行时长下限（秒），默认 4 */
  minDuration?: number;
  /** 飞行时长上限（秒），默认 16 */
  maxDuration?: number;
  /** 缺省飞行时长（item 未指定 duration 时使用），默认 8 */
  defaultDuration?: number;
}

/**
 * SpeedControlPlugin —— 速度控制（数据面，写 duration）。
 * 把每条弹幕的飞行时长按 factor 缩放并夹在 [min,max]；未指定 duration 时
 * 用 defaultDuration 作为基准。影响滚动/逆向弹幕速度，top/bottom 影响停留时长。
 */
export function createSpeedControlPlugin(
  config: SpeedControlConfig = {}
): DanmakuPlugin {
  const factor = config.factor ?? 1;
  const minDuration = config.minDuration ?? 4;
  const maxDuration = config.maxDuration ?? 16;
  const defaultDuration = config.defaultDuration ?? 8;

  const clamp = (v: number) => Math.min(maxDuration, Math.max(minDuration, v));

  return {
    name: "speed-control",
    version: "0.1.0",
    description: doc.description,
    priority: 26,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.map((it) => {
          const base = it.duration ?? defaultDuration;
          return { ...it, duration: clamp(base * factor) };
        });
        return { ...data, items };
      },
    },
  };
}

createSpeedControlPlugin.meta = doc as PluginDoc;
