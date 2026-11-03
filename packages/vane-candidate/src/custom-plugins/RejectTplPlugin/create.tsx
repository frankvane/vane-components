import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { Overlay } from "../../components/CandidatePlugin/plugins/overlay";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface RejectTemplate {
  id: string;
  title: string;
  body: string;
}

export interface RejectTplConfig {
  /** 婉拒信模板（替换内置模板） */
  templates?: RejectTemplate[];
  /** 流转到目标阶段 key（默认 rejected） */
  targetStage?: string;
}

const BUILTIN_TEMPLATES: RejectTemplate[] = [
  {
    id: "polite",
    title: "礼貌婉拒",
    body:
      "感谢您对本职位的关注。经过综合评估，我们认为您与当前岗位的匹配度仍有差距，但您的经历给我们留下了深刻印象。我们会将您纳入人才库，如有更合适的机会将第一时间与您联系。祝求职顺利！",
  },
  {
    id: "skill-gap",
    title: "技能方向不符",
    body:
      "感谢您抽出时间参与面试。该岗位更侧重 {{gap}} 方向的经验，与您当前的技术栈存在一定差异，故本次未能推进。期待未来在更匹配的岗位合作。",
  },
];

/**
 * RejectTpl —— 婉拒模板。
 * 卡片操作区「婉拒」入口；浮层内选择模板、可预览编辑，确认后把候选人
 * 流转到 targetStage（默认 rejected，自动留 history）。
 */
export const createRejectTplPlugin: CandidatePluginCreator<RejectTplConfig> = (
  config = {}
) => {
  const templates = config.templates ?? BUILTIN_TEMPLATES;
  const targetStage = config.targetStage ?? "rejected";
  return {
    name: "reject-tpl",
    version: "0.1.0",
    description: doc.description,
    priority: 50,
    config: { order: 50 },
    hooks: {
      renderCardActions: (ctx, candidate) => {
        const editing = ctx.state.rejectEditingId === candidate.id;
        return (
          <button
            key="reject"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={editing}
            aria-label={`婉拒 ${candidate.name}`}
            onClick={() =>
              ctx.setState({ rejectEditingId: editing ? null : candidate.id })
            }
            style={rejectBtn}
          >
            婉拒
          </button>
        );
      },
      renderOverlay: (ctx) => {
        const id = ctx.state.rejectEditingId as string | null;
        if (!id) return null;
        const candidate = ((ctx.data as Candidate[]) ?? []).find((c) => c.id === id);
        if (!candidate) return null;
        const tplId = (ctx.state.rejectTplId as string | null) ?? templates[0].id;
        const tpl = templates.find((t) => t.id === tplId) ?? templates[0];
        const close = () => ctx.setState({ rejectEditingId: null, rejectTplId: null });
        return (
          <Overlay key="reject-overlay" title={`婉拒 · ${candidate.name}`} onClose={close} width={400} zIndex={57}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={t.id === tpl.id}
                  onClick={() => ctx.setState({ rejectTplId: t.id })}
                  style={toolbarBtn(t.id === tpl.id)}
                >
                  {t.title}
                </button>
              ))}
            </div>
            <textarea
              key={tpl.id}
              aria-label="婉拒信内容"
              defaultValue={tpl.body}
              rows={6}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: `1px solid ${tokens.lineStrong}`,
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 13,
                color: tokens.text,
                background: "#fff",
                resize: "vertical",
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={close} style={toolbarBtn(false)}>
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  ctx.updateCandidate(id, { stage: targetStage });
                  close();
                }}
                style={toolbarBtn(true)}
              >
                确认婉拒
              </button>
            </div>
          </Overlay>
        );
      },
    },
  };
};

const rejectBtn = {
  border: `1px solid ${tokens.lineStrong}`,
  background: tokens.chipBg,
  color: "#b42318",
  borderRadius: 6,
  fontSize: 12,
  padding: "2px 8px",
  cursor: "pointer",
};

createRejectTplPlugin.meta = doc as PluginDoc;
