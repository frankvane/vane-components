import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import { tokens } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface SearchConfig {
  /** 参与搜索的字段 */
  fields?: Array<"name" | "role" | "summary" | "tags" | "source">;
  /** 防抖毫秒（受控输入场景建议 200+） */
  debounceMs?: number;
}

function matchText(c: Candidate, kw: string, fields: Array<"name" | "role" | "summary" | "tags" | "source">): boolean {
  const lower = kw.toLowerCase();
  for (const f of fields) {
    const v = c[f];
    if (typeof v === "string" && v.toLowerCase().includes(lower)) return true;
    if (Array.isArray(v) && v.some((t) => t.toLowerCase().includes(lower))) return true;
  }
  return false;
}

/**
 * Search —— 关键词搜索。
 * renderToolbar：搜索输入框（受控，写 ctx.state.searchKeyword，输入即时响应）；
 * transformData 按 姓名/岗位/摘要/标签/来源 匹配过滤，关键词经 debounceMs 防抖
 * 后才生效（输入频繁时用上一次已生效关键词过滤，避免每 keystroke 全量重跑管线）。
 * 空关键词不过滤。
 */
export const createSearchPlugin: CandidatePluginCreator<SearchConfig> = (
  config = {}
) => {
  const fields = config.fields ?? ["name", "role", "summary", "tags", "source"];
  const debounceMs = config.debounceMs ?? 0;
  // 防抖状态：appliedKw = 当前已生效关键词（闭包内，每插件实例一份）
  let appliedKw: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    name: "search",
    version: "0.1.0",
    description: doc.description,
    priority: 40,
    config: { order: 40 },
    hooks: {
      transformData: (ctx, data) => {
        const kw = (ctx.state.searchKeyword as string | undefined)?.trim();
        if (!debounceMs || kw === appliedKw) {
          appliedKw = kw;
          if (timer) {
            clearTimeout(timer);
            timer = undefined;
          }
          if (!kw) return data;
          return (((data as Candidate[]) ?? []).filter((c) =>
            matchText(c, kw, fields)
          )) as typeof data;
        }
        // 关键词变化中：重置防抖计时，本帧继续用上一次已生效的关键词
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = undefined;
          appliedKw = kw;
          ctx.forceUpdate();
        }, debounceMs);
        const active = appliedKw;
        if (!active) return data;
        return (((data as Candidate[]) ?? []).filter((c) =>
          matchText(c, active, fields)
        )) as typeof data;
      },
      renderToolbar: (ctx) => {
        const kw = (ctx.state.searchKeyword as string | undefined) ?? "";
        return (
          <span key="search" style={{ display: "inline-flex", alignItems: "center" }}>
            <input
              type="search"
              aria-label="搜索候选人"
              placeholder="搜索姓名 / 岗位 / 标签…"
              // 受控：外部重置 searchKeyword（如批量操作联动清空）时输入框 UI 同步
              value={kw}
              onChange={(e) =>
                ctx.setState({ searchKeyword: e.target.value || undefined })
              }
              style={{
                border: `1px solid ${tokens.lineStrong}`,
                borderRadius: 6,
                fontSize: 12,
                padding: "4px 8px",
                width: 180,
                color: tokens.text,
                background: "#fff",
              }}
            />
          </span>
        );
      },
    },
  };
};

createSearchPlugin.meta = doc as PluginDoc;
