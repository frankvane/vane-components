import type { PluginDoc } from "vane-plugin-core";
import type {
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { tokens } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface ScoreConfig {
  /** >= 该值显示为绿色（优秀） */
  goodThreshold?: number;
  /** >= 该值显示为橙色（待定），否则红色（偏低） */
  warnThreshold?: number;
}

/** 匹配分 → 语义色（实色，满足对比度） */
export function scoreTone(score: number, good: number, warn: number): string {
  return score >= good ? tokens.good : score >= warn ? tokens.warn : tokens.bad;
}

/**
 * Score —— 候选人岗位匹配分徽章。
 * renderCardBadges：按阈值着色的分数胶囊（80+ 绿 / 60+ 橙 / 其余红）。
 */
export const createScorePlugin: CandidatePluginCreator<ScoreConfig> = (
  config = {}
) => {
  const good = config.goodThreshold ?? 80;
  const warn = config.warnThreshold ?? 60;
  return {
    name: "score",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config: { order: 10 },
    hooks: {
      renderCardBadges: (_ctx, candidate) => {
        if (typeof candidate.score !== "number") return null;
        const color = scoreTone(candidate.score, good, warn);
        return (
          <span
            key="score"
            title={`匹配分 ${candidate.score}`}
            aria-label={`匹配分 ${candidate.score}`}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color,
              border: `1px solid ${color}`,
              borderRadius: 999,
              padding: "0 8px",
              lineHeight: "18px",
            }}
          >
            {candidate.score}分
          </span>
        );
      },
    },
  };
};

createScorePlugin.meta = doc as PluginDoc;
