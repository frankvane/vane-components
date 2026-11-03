import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import doc from "./doc.json";

export interface RecommendSortConfig {
  /** 排序依据：score 匹配分优先 / fresh 投递时间优先 */
  by?: "score" | "fresh";
  /** 是否降序（默认 true：分高 / 新投递在前） */
  desc?: boolean;
}

function parseTime(v?: string): number {
  if (!v) return 0;
  const t = Date.parse(v);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * RecommendSort —— 智能推荐排序。
 * transformData 对候选人列表排序：score 模式按匹配分（分数相同按投递时间新
 * 在前）；fresh 模式按投递时间。已归档候选人交给 ArchivePool 过滤，本插件
 * 不关心。仅重排顺序，不增删数据。
 */
export const createRecommendSortPlugin: CandidatePluginCreator<RecommendSortConfig> = (
  config = {}
) => {
  const by = config.by ?? "score";
  const desc = config.desc ?? true;
  return {
    name: "recommend-sort",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    config: { order: 30 },
    hooks: {
      transformData: (_ctx, data) => {
        const list = [...((data as Candidate[]) ?? [])];
        const dir = desc ? -1 : 1;
        list.sort((a, b) => {
          if (by === "score") {
            const sa = a.score ?? -1;
            const sb = b.score ?? -1;
            if (sa !== sb) return (sa - sb) * dir;
            return (parseTime(a.appliedAt) - parseTime(b.appliedAt)) * -dir;
          }
          return (parseTime(a.appliedAt) - parseTime(b.appliedAt)) * dir;
        });
        return list as typeof data;
      },
    },
  };
};

createRecommendSortPlugin.meta = doc as PluginDoc;
