import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface TrackStrategyConfig {
  /** 管理员/高等级用户钉到顶部轨道（track=0），默认 true */
  vipTop?: boolean;
  /** 触发 vipTop 的等级阈值，默认 18 */
  vipLevel?: number;
  /** 其余滚动弹幕强制分散起始轨道（避免全挤顶部），默认 false */
  spread?: boolean;
}

/**
 * TrackStrategyPlugin —— 轨道分配策略（数据面，写 renderHint.track）。
 * vipTop：管理员/高等级用户的滚动弹幕建议钉到顶部轨道（track=0），
 * 由调度器在空闲且不落避让区时采用（见 render.ts assignTrack 的 forced 分支）。
 * 该插件只产出「建议轨道」，是否采用由内核调度器最终裁决，避免硬冲突。
 */
export function createTrackStrategyPlugin(
  config: TrackStrategyConfig = {}
): DanmakuPlugin {
  const vipTop = config.vipTop ?? true;
  const vipLevel = config.vipLevel ?? 18;
  const spread = config.spread ?? false;

  return {
    name: "track-strategy",
    version: "0.1.0",
    description: doc.description,
    priority: 25,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.map((it, i) => {
          if (it.renderHint?.track != null) return it;
          if (
            vipTop &&
            it.mode === "scroll" &&
            (it.meta.isAdmin || (it.meta.level ?? 0) >= vipLevel)
          ) {
            return { ...it, renderHint: { ...it.renderHint, track: 0 } };
          }
          if (spread && it.mode === "scroll") {
            return { ...it, renderHint: { ...it.renderHint, track: i % 3 } };
          }
          return it;
        });
        return { ...data, items };
      },
    },
  };
}

createTrackStrategyPlugin.meta = doc as PluginDoc;
