import type { PluginDoc } from "vane-plugin-core";
import type {
  CandidatePluginCreator,
  StageConfig,
} from "../../components/CandidatePlugin/plugins/types";
import { DEFAULT_STAGES } from "../../components/CandidatePlugin/plugins/types";
import { TONE_COLOR, tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface ViewSwitchConfig {
  /** 列表视图每页条数上限（0 = 不分页） */
  pageSize?: number;
}

/**
 * ViewSwitch —— 看板 / 列表视图切换。
 * 工具栏两个互斥按钮写 state.view；renderCards 内容覆盖槽在 list 模式下
 * 渲染紧凑表格视图，kanban 模式返回 null 回落核心默认看板。
 */
export const createViewSwitchPlugin: CandidatePluginCreator<ViewSwitchConfig> = (
  config = {}
) => {
  const pageSize = config.pageSize ?? 0;
  return {
    name: "view-switch",
    version: "0.1.0",
    description: doc.description,
    priority: 70,
    config: { order: 70 },
    hooks: {
      renderToolbar: (ctx) => {
        const view = (ctx.state.view as string | undefined) ?? "kanban";
        return (
          <span key="view-switch" style={{ display: "inline-flex", gap: 0 }}>
            <button
              type="button"
              aria-pressed={view === "kanban"}
              onClick={() => ctx.setState({ view: "kanban" })}
              style={{ ...toolbarBtn(view === "kanban"), borderRadius: "6px 0 0 6px" }}
            >
              看板
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => ctx.setState({ view: "list" })}
              style={{ ...toolbarBtn(view === "list"), borderRadius: "0 6px 6px 0", marginLeft: -1 }}
            >
              列表
            </button>
          </span>
        );
      },
      renderCards: (ctx, payload) => {
        if (((ctx.state.view as string | undefined) ?? "kanban") !== "list") return null;
        const stages = (payload.stages ??
          (DEFAULT_STAGES as StageConfig[])) as StageConfig[];
        const stageLabel = (key: string) => stages.find((s) => s.key === key)?.label ?? key;
        let candidates = payload.candidates;
        if (pageSize > 0) candidates = candidates.slice(0, pageSize);
        return (
          <div
            key="list-view"
            role="table"
            aria-label="候选人列表视图"
            style={{
              border: `1px solid ${tokens.line}`,
              borderRadius: "var(--vcd-radius, 8px)",
              overflow: "hidden",
            }}
          >
            <div
              role="row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.4fr 1fr 1fr",
                background: tokens.chipBg,
                fontSize: 12,
                fontWeight: 700,
                color: tokens.muted,
                padding: "6px 12px",
                gap: 8,
              }}
            >
              <span role="columnheader">候选人</span>
              <span role="columnheader">阶段</span>
              <span role="columnheader">来源</span>
              <span role="columnheader">投递时间</span>
            </div>
            {candidates.map((c, i) => {
              const tone = TONE_COLOR[
                stages.find((s) => s.key === c.stage)?.tone ?? "neutral"
              ] ?? TONE_COLOR.neutral;
              return (
                <div
                  key={c.id}
                  role="row"
                  data-candidate-id={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.4fr 1fr 1fr",
                    padding: "8px 12px",
                    gap: 8,
                    fontSize: 13,
                    borderTop: i === 0 ? "none" : `1px solid ${tokens.line}`,
                    alignItems: "center",
                  }}
                >
                  <span role="cell" style={{ color: tokens.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong>{c.name}</strong>
                    <span style={{ color: tokens.muted }}> · {c.role}</span>
                  </span>
                  <span role="cell">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tone.fg,
                        background: tone.bg,
                        borderRadius: 999,
                        padding: "0 8px",
                        lineHeight: "18px",
                      }}
                    >
                      {stageLabel(c.stage)}
                    </span>
                  </span>
                  <span role="cell" style={{ color: tokens.muted, fontSize: 12 }}>{c.source ?? "—"}</span>
                  <span role="cell" style={{ color: tokens.muted, fontSize: 12 }}>{c.appliedAt ?? "—"}</span>
                </div>
              );
            })}
            {candidates.length === 0 && (
              <div style={{ padding: "12px", color: tokens.muted, fontSize: 13 }}>暂无候选人</div>
            )}
          </div>
        );
      },
    },
  };
};

createViewSwitchPlugin.meta = doc as PluginDoc;
