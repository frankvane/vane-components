import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

/**
 * LocationPlugin - 地理位置：评论含 location 时在操作行展示 📍 标（Core 不渲染 location，由本插件补充）。
 */
export function createLocationPlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "LocationPlugin",
    version: "0.1.0",
    description:
      "地理位置：评论含 location 时在操作行展示 📍 标（Core 不渲染 location，由本插件补充展示）。",
    priority: 28,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) =>
        comment.location ? (
          <span
            data-testid="comment-location"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              fontSize: 12,
              color: "#5b6064",
              flexShrink: 0,
            }}
          >
            📍{comment.location}
          </span>
        ) : null,
    },
  };
}

export { doc };
