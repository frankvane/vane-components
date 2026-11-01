import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
  FanBadge,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface FanBadgeConfig {
  /** userId -> 粉丝牌（FanBadgePlugin 据此富化弹幕 meta.fanBadge） */
  badges?: Record<string, FanBadge>;
  /** 缺省牌底色（lookup 未提供 color 时） */
  defaultColor?: string;
}

/**
 * FanBadgePlugin —— 粉丝牌（数据面）。
 * 按 userId 把粉丝牌富化进 meta.fanBadge；渲染由 canvas 内核读 meta 绘制牌底块 + 白字。
 * 插件绝不直绘 canvas，只写数据。
 */
export function createFanBadgePlugin(
  config: FanBadgeConfig = {}
): DanmakuPlugin {
  const badges = config.badges ?? {};
  const defaultColor = config.defaultColor ?? "#ff7a29";

  return {
    name: "fan-badge",
    version: "0.1.0",
    description: doc.description,
    priority: 11,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.map((it) => {
          if (it.meta.fanBadge || !it.meta.userId) return it;
          const b = badges[it.meta.userId];
          if (!b) return it;
          return {
            ...it,
            meta: {
              ...it.meta,
              fanBadge: { ...b, color: b.color ?? defaultColor },
            },
          };
        });
        return { ...data, items };
      },
    },
  };
}

createFanBadgePlugin.meta = doc as PluginDoc;
