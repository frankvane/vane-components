import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface PinnedTopConfig {
  /** 高赞阈值：meta.level >= 该值即置顶 + 高赞环，默认 18 */
  minLevel?: number;
}

/**
 * PinnedTopPlugin —— 高赞置顶（数据面）。
 * 高等级用户的弹幕标记 renderHint.pinned + ring：内核把它们钉在顶部带、居中停留、
 * 加高赞环高亮（不随风滚动）。阈值用 meta.level 作为「高赞」代理（模型无独立点赞字段）。
 */
export function createPinnedTopPlugin(
  config: PinnedTopConfig = {}
): DanmakuPlugin {
  const minLevel = config.minLevel ?? 18;

  return {
    name: "pinned-top",
    version: "0.1.0",
    description: doc.description,
    priority: 12,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.map((it) => {
          if ((it.meta.level ?? 0) >= minLevel && !it.renderHint?.pinned) {
            return {
              ...it,
              renderHint: { ...it.renderHint, pinned: true, ring: true },
            };
          }
          return it;
        });
        return { ...data, items };
      },
    },
  };
}

createPinnedTopPlugin.meta = doc as PluginDoc;
