import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

export interface FilterPluginConfig {
  /** 筛选项（影响顶栏按钮与 transformData 过滤逻辑），默认 ["all","image","replies"] */
  options?: Array<"all" | "image" | "replies">;
}

const LABELS: Record<string, string> = {
  all: "全部",
  image: "有图",
  replies: "有回复",
};

const chip = (active: boolean): React.CSSProperties => ({
  border: "none",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 13,
  cursor: "pointer",
  background: active ? "rgba(29,161,242,0.16)" : "transparent",
  color: active ? "#1565c0" : "inherit",
  opacity: active ? 1 : 0.7,
});

/** 筛选栏：点击切换 state.filter，由 transformData 过滤列表 */
function FilterBar({
  context,
  options,
}: {
  context: CommentPluginContext<any>;
  options: string[];
}) {
  const active = (context.state as any)?.filter ?? "all";
  const set = (key: string) => context.setState({ filter: key });
  return (
    <div data-testid="comment-filter" style={{ display: "inline-flex", gap: 4 }}>
      {options.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => set(key)}
          style={chip(active === key)}
        >
          {LABELS[key] ?? key}
        </button>
      ))}
    </div>
  );
}

/**
 * FilterPlugin - 筛选：顶栏「全部/有图/有回复」筛选，经 transformData 过滤评论列表。
 */
export function createFilterPlugin<T = any>(
  config: FilterPluginConfig = {}
): CommentPlugin<T> {
  const options = config.options ?? ["all", "image", "replies"];
  return {
    name: "FilterPlugin",
    version: "0.1.0",
    description:
      "筛选：顶栏「全部/有图/有回复」筛选，经 transformData 过滤评论列表（读 state.filter）。",
    priority: 12,
    enabled: true,
    hooks: {
      renderToolbar: (context: CommentPluginContext<T>) => (
        <FilterBar context={context as CommentPluginContext<any>} options={options} />
      ),
      transformData: (context: CommentPluginContext<T>, data: T): T => {
        const filter = (context.state as any)?.filter ?? "all";
        if (filter === "all" || !Array.isArray(data)) return data;
        const arr = data as Comment[];
        if (filter === "image")
          return arr.filter((c) => (c.images?.length ?? 0) > 0) as unknown as T;
        if (filter === "replies")
          return arr.filter(
            (c) => (c.replies?.length ?? 0) > 0 || (c.replyCount ?? 0) > 0
          ) as unknown as T;
        return data;
      },
    },
  };
}

export { doc };
