import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

/**
 * CountPlugin - 计数：顶栏展示评论总数 + 热议标，读 context.comments.length（含 Filter/Search 结果）。
 */
export function createCountPlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "CountPlugin",
    version: "0.1.0",
    description:
      "计数：顶栏展示评论总数 + 热议标，读取 context.comments.length（随 Filter/Search 实时变化）。",
    priority: 11,
    enabled: true,
    hooks: {
      renderToolbar: (context: CommentPluginContext<T>) => {
        const total = context.comments?.length ?? 0;
        return (
          <span
            data-testid="comment-count"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <strong>{total}</strong> 条评论
            {total > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 4,
                  color: "#b35c00",
                  border: "1px solid rgba(255,143,0,0.4)",
                }}
              >
                热议
              </span>
            )}
          </span>
        );
      },
    },
  };
}

export { doc };
