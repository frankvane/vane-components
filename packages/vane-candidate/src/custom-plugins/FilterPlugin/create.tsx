import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
  StageConfig,
} from "../../components/CandidatePlugin/plugins/types";
import { DEFAULT_STAGES } from "../../components/CandidatePlugin/plugins/types";
import { tokens, toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface FilterConfig {
  /** 可选的标签筛选项（默认从数据里收集） */
  tagOptions?: string[];
}

/**
 * Filter —— 阶段 / 标签筛选。
 * renderToolbar：阶段下拉 + 标签下拉 + 清除按钮（状态写 ctx.state.filterStage /
 * filterTag）；transformData 按 state 过滤候选人列表。
 */
export const createFilterPlugin: CandidatePluginCreator<FilterConfig> = (
  config = {}
) => {
  return {
    name: "filter",
    version: "0.1.0",
    description: doc.description,
    priority: 50,
    config: { order: 50 },
    hooks: {
      transformData: (ctx, data) => {
        const stage = ctx.state.filterStage as string | undefined;
        const tag = ctx.state.filterTag as string | undefined;
        if (!stage && !tag) return data;
        const list = (data as Candidate[]) ?? [];
        return list.filter(
          (c) =>
            (!stage || c.stage === stage) && (!tag || (c.tags ?? []).includes(tag))
        ) as typeof data;
      },
      renderToolbar: (ctx) => {
        const stages = (ctx.props?.stages ??
          (DEFAULT_STAGES as StageConfig[])) as StageConfig[];
        const stage = (ctx.state.filterStage as string | undefined) ?? "";
        const tag = (ctx.state.filterTag as string | undefined) ?? "";
        // 标签选项：优先配置；否则从全量原始数据收集（ctx.data 会随筛选收窄选项）
        const tagOptions =
          config.tagOptions ??
          Array.from(
            new Set(
              (((ctx.rawData as Candidate[] | undefined) ??
                (ctx.data as Candidate[] | undefined)) ?? []
              ).flatMap((c) => c.tags ?? [])
            )
          );
        const hasFilter = !!(stage || tag);
        return (
          <span key="filter" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <select
              aria-label="按阶段筛选"
              value={stage}
              onChange={(e) => ctx.setState({ filterStage: e.target.value || undefined })}
              style={selectStyle}
            >
              <option value="">全部阶段</option>
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            {tagOptions.length > 0 && (
              <select
                aria-label="按标签筛选"
                value={tag}
                onChange={(e) => ctx.setState({ filterTag: e.target.value || undefined })}
                style={selectStyle}
              >
                <option value="">全部标签</option>
                {tagOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
            {hasFilter && (
              <button
                type="button"
                onClick={() => ctx.setState({ filterStage: undefined, filterTag: undefined })}
                style={toolbarBtn(false)}
              >
                清除筛选
              </button>
            )}
          </span>
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

createFilterPlugin.meta = doc as PluginDoc;
