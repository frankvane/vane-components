import type { PluginDoc } from "vane-plugin-core";
import type {
  CandidatePluginCreator,
  StageConfig,
} from "../../components/CandidatePlugin/plugins/types";
import { DEFAULT_STAGES } from "../../components/CandidatePlugin/plugins/types";
import { stageIndexOf } from "../../components/CandidatePlugin/domain";
import { tokens } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface StageFlowConfig {
  /** 每次流转的步长（默认 ±1） */
  step?: number;
  /** 是否允许回退（默认允许） */
  allowBackward?: boolean;
}

/**
 * StageFlow —— 阶段流转按钮。
 * 卡片操作区「◀ 推进 ▶」，经 ctx.moveCandidate 流转（装配层落内部态并自动
 * 追加 history）；边界阶段禁用对应方向。step / allowBackward 可配。
 */
export const createStageFlowPlugin: CandidatePluginCreator<StageFlowConfig> = (
  config = {}
) => {
  const step = config.step ?? 1;
  const allowBackward = config.allowBackward ?? true;
  return {
    name: "stage-flow",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config: { order: 20 },
    hooks: {
      renderCardActions: (ctx, candidate) => {
        const stages = (ctx.props?.stages ??
          (DEFAULT_STAGES as StageConfig[])) as StageConfig[];
        const idx = stageIndexOf(stages, candidate.stage);
        const atFirst = idx <= 0;
        const atLast = idx < 0 || idx >= stages.length - 1;
        const btnStyle = (disabled: boolean) => ({
          ...{ ...flowBtn },
          ...(disabled ? { color: tokens.faint, cursor: "not-allowed" } : {}),
        });
        return (
          <span key="stage-flow" style={{ display: "inline-flex", gap: 2 }}>
            {allowBackward && (
              <button
                type="button"
                disabled={atFirst}
                aria-label={`将 ${candidate.name} 退回上一阶段`}
                onClick={() => ctx.moveCandidate(candidate.id, -step)}
                style={btnStyle(atFirst)}
              >
                ◀
              </button>
            )}
            <button
              type="button"
              disabled={atLast}
              aria-label={`将 ${candidate.name} 推进到下一阶段`}
              onClick={() => ctx.moveCandidate(candidate.id, step)}
              style={btnStyle(atLast)}
            >
              ▶
            </button>
          </span>
        );
      },
    },
  };
};

const flowBtn = {
  border: `1px solid ${tokens.lineStrong}`,
  background: tokens.chipBg,
  color: tokens.chipText,
  borderRadius: 6,
  fontSize: 12,
  padding: "2px 8px",
  cursor: "pointer",
  lineHeight: "18px",
};

createStageFlowPlugin.meta = doc as PluginDoc;
