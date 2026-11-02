import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface KeywordHighlightConfig {
  /** 初始高亮关键词（JD 关键词集合） */
  keywords?: string[] | (() => string[]);
  /** 高亮标记 / 芯片描边色（默认跟随主题强调色） */
  color?: string;
}

/**
 * KeywordHighlight —— 关键词高亮（纯 state 驱动，不抢槽）。
 * 核心文本渲染统一走 highlightText(ctx.state.highlightKeywords)，本插件只负责
 * 维护该 state：工具栏输入 / 添加 / 移除关键词。与 TimelineView / SectionCollapse
 * 等同为「state 派」，可并存。
 */
export const createKeywordHighlightPlugin: ResumePluginCreator<KeywordHighlightConfig> = (config = {}) => {
  const initial =
    typeof config.keywords === "function"
      ? config.keywords()
      : config.keywords ?? [];
  const accent = config.color ?? "var(--vr-accent, #2f6feb)";

  return {
    name: "keyword-highlight",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config: { order: 20 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.highlightKeywords === undefined) {
          ctx.setState({ highlightKeywords: [...initial], kwDraft: "" });
        }
      },
      renderToolbar: (ctx) => {
        const kws = (ctx.state.highlightKeywords as string[] | undefined) ?? [];
        const draft = (ctx.state.kwDraft as string | undefined) ?? "";
        const add = () => {
          const v = draft.trim();
          if (!v) return;
          if (!kws.includes(v)) ctx.setState({ highlightKeywords: [...kws, v] });
          ctx.setState({ kwDraft: "" });
        };
        return (
          <div
            key="keyword-highlight"
            style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}
          >
            <span style={{ fontSize: 12, color: "var(--vr-faint, #8a9099)" }}>高亮</span>
            <input
              value={draft}
              placeholder="关键词"
              aria-label="高亮关键词"
              onChange={(e) => ctx.setState({ kwDraft: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              style={{ width: 92, padding: "3px 6px", fontSize: 12, borderRadius: 6, border: "1px solid #d4d8de" }}
            />
            <button type="button" onClick={add} style={toolbarBtn(false)}>
              添加
            </button>
            {kws.map((k) => (
              <span
                key={k}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  background: "var(--vr-accent-wash, #eef3fe)",
                  color: accent,
                  border: "1px solid var(--vr-line, #e3e6ea)",
                  borderRadius: 12,
                  padding: "1px 4px 1px 8px",
                  fontSize: 12,
                }}
              >
                {k}
                <button
                  type="button"
                  aria-label={`移除 ${k}`}
                  onClick={() =>
                    ctx.setState({ highlightKeywords: kws.filter((x) => x !== k) })
                  }
                  style={{ border: "none", background: "transparent", color: accent, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        );
      },
    },
  };
};

createKeywordHighlightPlugin.meta = doc as PluginDoc;
