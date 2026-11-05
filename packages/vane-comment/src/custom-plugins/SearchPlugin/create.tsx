import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { SearchBox } from "./SearchBox";
import { toText } from "./text";
import doc from "./doc.json";

/**
 * SearchPlugin - 搜索：顶栏输入框，经 transformData 按关键词过滤评论。
 *
 * 泛型默认值保留 any：跨包契约位（第三方可传自定义 data 形态，收紧会让既有调用方 tsc 失败）。
 */
export function createSearchPlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "SearchPlugin",
    version: "0.1.0",
    description: "搜索：顶栏输入框，经 transformData 按关键词过滤评论（读 state.query）。",
    priority: 13,
    enabled: true,
    hooks: {
      renderToolbar: (context: CommentPluginContext<T>) => (
        <SearchBox context={context} />
      ),
      transformData: (context: CommentPluginContext<T>, data: T): T => {
        const raw = context.state.query;
        const q = (typeof raw === "string" ? raw : "").trim().toLowerCase();
        if (!q || !Array.isArray(data)) return data;
        return (data as Comment[]).filter((c) =>
          toText(c).toLowerCase().includes(q)
        ) as unknown as T;
      },
    },
  };
}

export { doc };
