import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

/** 绝对时间格式化 YYYY-MM-DD HH:mm */
function formatAbs(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * TimestampPlugin - 绝对时间：Core 默认展示相对时间，本插件在操作行补充「绝对时间」芯片，便于精确查看。
 */
export function createTimestampPlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "TimestampPlugin",
    version: "0.1.0",
    description:
      "绝对时间：Core 默认展示相对时间，本插件在操作行补充「绝对时间」芯片，便于精确查看发布时刻。",
    priority: 29,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <span
          data-testid="comment-timestamp"
          style={{ fontSize: 12, color: "#6b6b6b", flexShrink: 0, whiteSpace: "nowrap" }}
          title="绝对时间"
        >
          {formatAbs(comment.createdAt)}
        </span>
      ),
    },
  };
}

export { doc };
