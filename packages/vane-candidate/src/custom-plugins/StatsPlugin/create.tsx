import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
  StageConfig,
} from "../../components/CandidatePlugin/plugins/types";
import { DEFAULT_STAGES } from "../../components/CandidatePlugin/plugins/types";
import { TONE_COLOR, tokens } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface StatsConfig {
  /** 是否在列头显示计数徽章（renderColumnHeader） */
  columnCount?: boolean;
}

/**
 * Stats —— 漏斗统计。
 * renderFooter：各阶段人数占比条形图（点击阶段可联动 Filter 的
 * filterStage，若无 Filter 插件则仅展示）；renderColumnHeader：列头计数徽章。
 */
export const createStatsPlugin: CandidatePluginCreator<StatsConfig> = (
  config = {}
) => {
  const columnCount = config.columnCount ?? true;
  return {
    name: "stats",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config: { order: 10 },
    hooks: {
      renderColumnHeader: columnCount
        ? (_ctx, stage, count) => (
            <span
              key="col-count"
              aria-label={`${stage.label} ${count} 人`}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: (TONE_COLOR[stage.tone ?? "neutral"] ?? TONE_COLOR.neutral).fg,
                background: tokens.bg,
                border: `1px solid ${tokens.line}`,
                borderRadius: 999,
                padding: "0 6px",
                lineHeight: "16px",
              }}
            >
              {count}
            </span>
          )
        : undefined,
      renderFooter: (ctx) => {
        const stages = (ctx.props?.stages ??
          (DEFAULT_STAGES as StageConfig[])) as StageConfig[];
        const candidates = (ctx.data as Candidate[]) ?? [];
        const total = candidates.length;
        if (total === 0) return null;
        return (
          <span
            key="stats-funnel"
            role="img"
            aria-label={`漏斗统计：共 ${total} 人，` + stages
              .map((s) => `${s.label} ${candidates.filter((c) => c.stage === s.key).length} 人`)
              .join("，")}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}
          >
            <span style={{ fontSize: 12, color: tokens.muted }}>漏斗</span>
            {stages.map((s) => {
              const count = candidates.filter((c) => c.stage === s.key).length;
              const tone = TONE_COLOR[s.tone ?? "neutral"] ?? TONE_COLOR.neutral;
              return (
                <span
                  key={s.key}
                  title={`${s.label}: ${count} 人`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: tone.fg,
                    background: tone.bg,
                    borderRadius: 999,
                    padding: "0 8px",
                    lineHeight: "18px",
                  }}
                >
                  {s.label}
                  <span
                    style={{
                      display: "inline-block",
                      width: Math.max(count * 4, 2),
                      height: 8,
                      borderRadius: 4,
                      background: tone.fg,
                    }}
                    aria-hidden="true"
                  />
                  {count}
                </span>
              );
            })}
          </span>
        );
      },
    },
  };
};

createStatsPlugin.meta = doc as PluginDoc;
