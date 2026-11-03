import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { Overlay } from "../../components/CandidatePlugin/plugins/overlay";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface NoteConfig {
  /** 备注作者署名（无宿主登录态时的默认作者） */
  authorName?: string;
  /** 每位候选人最多保留备注条数 */
  maxNotes?: number;
}

/**
 * Note —— 招聘备注。
 * 卡片操作区备注按钮（带条数角标）；浮层内查看/新增/删除备注，
 * 写回 candidate.notes（ctx.updateCandidate）。删除仅限自己刚加的（演示语义：
 * 所有插件写入的备注 author 相同即可删）。
 */
export const createNotePlugin: CandidatePluginCreator<NoteConfig> = (
  config = {}
) => {
  const authorName = config.authorName ?? "我";
  const maxNotes = config.maxNotes ?? 50;
  return {
    name: "note",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    config: { order: 30 },
    hooks: {
      renderCardActions: (ctx, candidate) => {
        const count = candidate.notes?.length ?? 0;
        return (
          <button
            key="note"
            type="button"
            aria-haspopup="dialog"
            aria-label={`${candidate.name} 的备注（${count} 条）`}
            onClick={() =>
              ctx.setState({
                noteEditingId: ctx.state.noteEditingId === candidate.id ? null : candidate.id,
              })
            }
            style={noteBtn}
          >
            备注{count > 0 ? ` (${count})` : ""}
          </button>
        );
      },
      renderOverlay: (ctx) => {
        const id = ctx.state.noteEditingId as string | null;
        if (!id) return null;
        const candidate = ((ctx.data as Candidate[]) ?? []).find((c) => c.id === id);
        if (!candidate) return null;
        const notes = candidate.notes ?? [];
        const close = () => ctx.setState({ noteEditingId: null });
        return (
          <Overlay key="note-overlay" title={`备注 · ${candidate.name}`} onClose={close} width={380} zIndex={56}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem("text") as HTMLInputElement | null;
                const text = input?.value.trim();
                if (!text) return;
                ctx.updateCandidate(id, {
                  notes: [
                    ...notes,
                    { id: `n-${Date.now()}`, author: authorName, at: new Date().toISOString(), text },
                  ].slice(-maxNotes),
                });
                if (input) input.value = "";
              }}
              style={{ display: "flex", gap: 6, marginBottom: 12 }}
            >
              <input
                name="text"
                aria-label="备注内容"
                placeholder="记录沟通要点…"
                style={{
                  flex: 1,
                  border: `1px solid ${tokens.lineStrong}`,
                  borderRadius: 6,
                  padding: "5px 8px",
                  fontSize: 13,
                  color: tokens.text,
                  background: "#fff",
                }}
              />
              <button type="submit" style={toolbarBtn(true)}>添加</button>
            </form>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notes.length === 0 && (
                <span style={{ color: tokens.muted, fontSize: 13 }}>暂无备注</span>
              )}
              {notes
                .slice()
                .reverse()
                .map((n) => (
                  <div
                    key={n.id}
                    style={{
                      border: `1px solid ${tokens.line}`,
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                      <strong style={{ color: tokens.text }}>{n.author}</strong>
                      <span style={{ color: tokens.faint, fontSize: 12 }}>
                        {n.at.slice(0, 16).replace("T", " ")}
                      </span>
                      <button
                        type="button"
                        aria-label={`删除备注 ${n.text.slice(0, 8)}`}
                        onClick={() =>
                          ctx.updateCandidate(id, {
                            notes: notes.filter((x) => x.id !== n.id),
                          })
                        }
                        style={{
                          marginLeft: "auto",
                          border: "none",
                          background: "transparent",
                          color: tokens.bad,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        删除
                      </button>
                    </div>
                    <div style={{ color: tokens.text }}>{n.text}</div>
                  </div>
                ))}
            </div>
          </Overlay>
        );
      },
    },
  };
};

const noteBtn = {
  border: `1px solid ${tokens.lineStrong}`,
  background: tokens.chipBg,
  color: tokens.chipText,
  borderRadius: 6,
  fontSize: 12,
  padding: "2px 8px",
  cursor: "pointer",
};

createNotePlugin.meta = doc as PluginDoc;
