import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
  StageConfig,
} from "../../components/CandidatePlugin/plugins/types";
import { DEFAULT_STAGES } from "../../components/CandidatePlugin/plugins/types";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface BatchOpConfig {
  /** 批量操作目标阶段（默认全部阶段） */
  targetStages?: StageConfig[];
}

/**
 * BatchOp —— 批量操作。
 * 工具栏「批量」开关进入选择模式；卡片操作区出现复选框（state.batchSelected）；
 * 工具栏随后展示全选/清空/批量流转到…/批量归档。所有写操作走
 * ctx.updateCandidate / ctx.moveCandidate，逐条落内部态。
 */
export const createBatchOpPlugin: CandidatePluginCreator<BatchOpConfig> = (
  config = {}
) => {
  return {
    name: "batch-op",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    config: { order: 30 },
    hooks: {
      renderToolbar: (ctx) => {
        const batchMode = !!ctx.state.batchMode;
        const selected = (ctx.state.batchSelected as string[] | undefined) ?? [];
        const stages =
          config.targetStages ??
          (ctx.props?.stages ?? (DEFAULT_STAGES as StageConfig[])) as StageConfig[];
        const candidates = ((ctx.data as Candidate[]) ?? []).filter((c) => !c.archived);
        return (
          <span key="batch-op" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              aria-pressed={batchMode}
              onClick={() =>
                ctx.setState({ batchMode: !batchMode, batchSelected: [] })
              }
              style={toolbarBtn(batchMode)}
            >
              批量
            </button>
            {batchMode && (
              <>
                <button
                  type="button"
                  aria-label="全选当前候选人"
                  onClick={() =>
                    ctx.setState({ batchSelected: candidates.map((c) => c.id) })
                  }
                  style={toolbarBtn(false)}
                >
                  全选
                </button>
                <button
                  type="button"
                  aria-label="清空选择"
                  onClick={() => ctx.setState({ batchSelected: [] })}
                  style={toolbarBtn(false)}
                >
                  清空
                </button>
                <select
                  aria-label="批量流转到阶段"
                  value=""
                  disabled={selected.length === 0}
                  onChange={(e) => {
                    const target = e.target.value;
                    if (!target) return;
                    for (const id of selected) {
                      const c = candidates.find((x) => x.id === id);
                      if (!c) continue;
                      const from = stages.findIndex((s) => s.key === c.stage);
                      const to = stages.findIndex((s) => s.key === target);
                      if (from >= 0 && to >= 0) {
                        ctx.moveCandidate(id, to - from);
                      } else {
                        ctx.updateCandidate(id, { stage: target });
                      }
                    }
                    ctx.setState({ batchSelected: [] });
                  }}
                  style={{
                    ...selectStyle,
                    ...(selected.length === 0 ? { color: tokens.faint } : {}),
                  }}
                >
                  <option value="">
                    流转到…{selected.length > 0 ? `（已选 ${selected.length}）` : ""}
                  </option>
                  {stages.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={selected.length === 0}
                  aria-label={`归档已选 ${selected.length} 位候选人`}
                  onClick={() => {
                    for (const id of selected) {
                      ctx.updateCandidate(id, { archived: true });
                    }
                    ctx.setState({ batchSelected: [] });
                  }}
                  style={{
                    ...toolbarBtn(false),
                    ...(selected.length === 0 ? { color: tokens.faint, cursor: "not-allowed" } : {}),
                  }}
                >
                  归档
                </button>
              </>
            )}
          </span>
        );
      },
      renderCardActions: (ctx, candidate) => {
        if (!ctx.state.batchMode) return null;
        const selected = ((ctx.state.batchSelected as string[] | undefined) ?? []);
        const checked = selected.includes(candidate.id);
        return (
          <label
            key="batch-check"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: tokens.muted }}
          >
            <input
              type="checkbox"
              checked={checked}
              aria-label={`选择 ${candidate.name}`}
              onChange={() =>
                ctx.setState({
                  batchSelected: checked
                    ? selected.filter((id) => id !== candidate.id)
                    : [...selected, candidate.id],
                })
              }
            />
            选择
          </label>
        );
      },
    },
  };
};

const selectStyle = {
  border: `1px solid ${tokens.lineStrong}`,
  borderRadius: 6,
  fontSize: 12,
  padding: "3px 6px",
  background: "#fff",
  color: tokens.text,
} as const;

createBatchOpPlugin.meta = doc as PluginDoc;
