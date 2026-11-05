import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import { LeaderboardPanel } from "./internal";
import doc from "./doc.json";

export interface LeaderboardPluginConfig extends ActivityPluginConfigBase {
  /** 标题（默认「好友榜」） */
  title?: string;
  /** 展示前几名（默认 3） */
  topN?: number;
  /** 分数单位（默认「分」） */
  unit?: string;
  /** 是否高亮 isMe 行（默认 true） */
  highlightMe?: boolean;
  /** 无数据时的文案（默认「暂无排行数据」） */
  emptyText?: string;
}

/**
 * LeaderboardPlugin - 好友榜：按 score 降序取前 topN，第一名强调橙名次牌，
 * isMe 行浅橙底高亮并带「我」标签；自己不在前 topN 时在底部单独补一行真实名次。
 */
export const createLeaderboardPlugin: PluginCreator<LeaderboardPluginConfig> = (
  config = {}
) => {
  const { title = "好友榜", topN = 3, unit = "分", highlightMe = true, emptyText = "暂无排行数据" } =
    config;

  return {
    name: "LeaderboardPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 25,
    config,
    hooks: {
      renderFooter: (context: ActivityPluginContext) => (
        <LeaderboardPanel
          ctx={context}
          title={title}
          topN={topN}
          unit={unit}
          highlightMe={highlightMe}
          emptyText={emptyText}
        />
      ),
    },
  };
};

createLeaderboardPlugin.meta = doc as PluginDoc;
