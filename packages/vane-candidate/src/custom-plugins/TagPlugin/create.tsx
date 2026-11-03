import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { Overlay } from "../../components/CandidatePlugin/plugins/overlay";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface TagConfig {
  /** 快捷标签建议（编辑面板里一键添加） */
  suggestTags?: string[];
  /** 每位候选人最多标签数 */
  maxTags?: number;
}

/**
 * Tag —— 候选人标签。
 * renderCardBadges：展示标签 chips；点击「管理」打开浮层，可添加/删除标签，
 * 写回 candidate.tags（ctx.updateCandidate）。
 */
export const createTagPlugin: CandidatePluginCreator<TagConfig> = (config = {}) => {
  const suggests = config.suggestTags ?? ["重点", "备选", "急招", "内推"];
  const maxTags = config.maxTags ?? 8;
  return {
    name: "tags",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    config: { order: 30 },
    hooks: {
      renderCardBadges: (ctx, candidate) => {
        const tags = candidate.tags ?? [];
        const editing = ctx.state.tagEditingId === candidate.id;
        return (
          <React.Fragment key="tags">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  color: tokens.chipText,
                  background: tokens.chipBg,
                  border: `1px solid ${tokens.line}`,
                  borderRadius: 999,
                  padding: "0 8px",
                  lineHeight: "18px",
                }}
              >
                {t}
              </span>
            ))}
            {tags.length > 3 && (
              <span
                title={tags.join("、")}
                aria-label={`共 ${tags.length} 个标签`}
                style={{ fontSize: 11, color: tokens.faint, lineHeight: "18px" }}
              >
                +{tags.length - 3}
              </span>
            )}
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={editing}
              aria-label={`${candidate.name} 的标签管理`}
              onClick={() =>
                ctx.setState({
                  tagEditingId: editing ? null : candidate.id,
                })
              }
              style={{
                ...toolbarBtn(false),
                fontSize: 11,
                padding: "0 6px",
                lineHeight: "16px",
              }}
            >
              标签
            </button>
          </React.Fragment>
        );
      },
      renderOverlay: (ctx) => {
        const id = ctx.state.tagEditingId as string | null;
        if (!id) return null;
        const candidate = ((ctx.data as Candidate[]) ?? []).find((c) => c.id === id);
        if (!candidate) return null;
        const tags = candidate.tags ?? [];
        const close = () => ctx.setState({ tagEditingId: null });
        const add = (t: string) => {
          const value = t.trim();
          if (!value || tags.includes(value) || tags.length >= maxTags) return;
          ctx.updateCandidate(id, { tags: [...tags, value] });
        };
        const remove = (t: string) =>
          ctx.updateCandidate(id, { tags: tags.filter((x) => x !== t) });
        return (
          <Overlay key="tags-overlay" title={`标签管理 · ${candidate.name}`} onClose={close} width={340} zIndex={56}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {tags.length === 0 && <span style={{ color: tokens.muted, fontSize: 13 }}>暂无标签</span>}
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: tokens.chipText,
                    background: tokens.chipBg,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 999,
                    padding: "2px 6px 2px 10px",
                  }}
                >
                  {t}
                  <button
                    type="button"
                    aria-label={`删除标签 ${t}`}
                    onClick={() => remove(t)}
                    style={{ border: "none", background: "transparent", color: tokens.bad, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem("tag") as HTMLInputElement | null);
                if (input?.value) {
                  add(input.value);
                  input.value = "";
                }
              }}
              style={{ display: "flex", gap: 6, marginBottom: 10 }}
            >
              <input
                name="tag"
                aria-label="新标签名称"
                placeholder="输入标签后回车"
                maxLength={12}
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
            <div>
              <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 4 }}>快捷标签</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {suggests.map((t) => (
                  <button key={t} type="button" onClick={() => add(t)} style={toolbarBtn(tags.includes(t))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Overlay>
        );
      },
    },
  };
};

createTagPlugin.meta = doc as PluginDoc;
