import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { Overlay } from "../../components/CandidatePlugin/plugins/overlay";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface ActivityLogConfig {
  /** 日志最多展示条数 */
  maxEntries?: number;
}

interface LogRow {
  at: string;
  action: string;
  detail?: string;
  candidateName: string;
}

/**
 * ActivityLog —— 操作日志。
 * 汇总所有候选人的 history（流转 / 备注等动作，由 updateCandidate /
 * moveCandidate 链路自动追加），按时间倒序在浮层展示；页脚提供入口按钮
 * （带日志总数）。日志写回由装配层与写操作插件负责，本插件只读。
 */
export const createActivityLogPlugin: CandidatePluginCreator<ActivityLogConfig> = (
  config = {}
) => {
  const maxEntries = config.maxEntries ?? 100;
  return {
    name: "activity-log",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config: { order: 20 },
    hooks: {
      renderFooter: (ctx) => {
        const rows = collectRows(ctx.data as Candidate[] | undefined);
        return (
          <button
            key="activity-log"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={!!ctx.state.activityLogOpen}
            onClick={() => ctx.setState({ activityLogOpen: !ctx.state.activityLogOpen })}
            style={toolbarBtn(!!ctx.state.activityLogOpen)}
          >
            操作日志（{rows.length}）
          </button>
        );
      },
      renderOverlay: (ctx) => {
        if (!ctx.state.activityLogOpen) return null;
        const rows = collectRows(ctx.data as Candidate[] | undefined).slice(0, maxEntries);
        const close = () => ctx.setState({ activityLogOpen: false });
        return (
          <Overlay key="activity-log-overlay" title="操作日志" onClose={close} width={400} zIndex={56}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rows.length === 0 && (
                <span style={{ color: tokens.muted, fontSize: 13 }}>
                  暂无日志：流转、备注等操作会自动记录到候选人 history。
                </span>
              )}
              {rows.map((r, i) => (
                <div
                  key={`${r.at}-${i}`}
                  style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "baseline" }}
                >
                  <span style={{ color: tokens.faint, fontSize: 12, flexShrink: 0 }}>
                    {r.at.slice(5, 16).replace("T", " ")}
                  </span>
                  <span style={{ color: tokens.text }}>
                    <strong>{r.candidateName}</strong> · {r.action}
                    {r.detail ? ` → ${r.detail}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </Overlay>
        );
      },
    },
  };
};

function collectRows(data: Candidate[] | undefined): LogRow[] {
  const rows: LogRow[] = [];
  for (const c of data ?? []) {
    for (const h of c.history ?? []) {
      rows.push({ ...h, candidateName: c.name });
    }
  }
  return rows.sort((a, b) => (a.at < b.at ? 1 : -1));
}

createActivityLogPlugin.meta = doc as PluginDoc;
