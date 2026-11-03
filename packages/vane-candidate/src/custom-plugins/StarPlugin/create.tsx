import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { tokens } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface StarConfig {
  /** 星标候选人是否在列表中优先展示（经 transformData 置顶） */
  pinTop?: boolean;
}

/**
 * Star —— 星标收藏。
 * 卡片操作区 ☆/★ 切换（写 candidate.starred）；pinTop 开启时星标候选人
 * 经 transformData 置顶到各自阶段列最前。
 */
export const createStarPlugin: CandidatePluginCreator<StarConfig> = (
  config = {}
) => {
  const pinTop = config.pinTop ?? true;
  return {
    name: "star",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config: { order: 10 },
    hooks: {
      ...(pinTop
        ? {
            transformData: (_ctx, data) => {
              const list = (data as Candidate[]) ?? [];
              const starred = list.filter((c) => c.starred);
              const rest = list.filter((c) => !c.starred);
              return [...starred, ...rest] as typeof data;
            },
          }
        : {}),
      renderCardActions: (ctx, candidate) => {
        const on = !!candidate.starred;
        return (
          <button
            key="star"
            type="button"
            aria-pressed={on}
            aria-label={on ? `取消星标 ${candidate.name}` : `星标 ${candidate.name}`}
            title={on ? "取消星标" : "星标"}
            onClick={() => ctx.updateCandidate(candidate.id, { starred: !on })}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              padding: "2px 4px",
              color: on ? "#e8590c" : tokens.faint,
              lineHeight: 1,
            }}
          >
            {on ? "★" : "☆"}
          </button>
        );
      },
    },
  };
};

createStarPlugin.meta = doc as PluginDoc;
