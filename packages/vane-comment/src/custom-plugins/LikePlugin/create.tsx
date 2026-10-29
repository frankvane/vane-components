import React, { useState } from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

export interface LikePluginConfig {
  /** 是否展示点赞数，默认 true */
  showCount?: boolean;
}

/** 点赞按钮：本地爆裂动画（component 内 CSS transition，规避 overlay 全局槽定位问题） */
function LikeButton({
  comment,
  onLike,
  showCount = true,
}: {
  comment: Comment;
  onLike?: (id: string, next: boolean) => void;
  showCount?: boolean;
}) {
  const [burst, setBurst] = useState(false);
  const liked = !!comment.liked;
  const count = comment.likeCount;

  const handle = () => {
    const next = !liked;
    onLike?.(comment.id, next);
    if (next) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 450);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={liked}
      data-testid="comment-like"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: "none",
        background: "transparent",
        color: liked ? "#c62828" : "inherit",
        opacity: liked ? 1 : 0.7,
        cursor: "pointer",
        fontSize: 13,
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: burst ? "scale(1.4)" : "scale(1)",
          transition: "transform 0.25s ease",
        }}
      >
        {liked ? "❤️" : "🤍"}
      </span>
      {showCount && (count > 0 ? count : "赞")}
    </button>
  );
}

/**
 * LikePlugin - 点赞：渲染于每条评论的 `renderCommentActions` 槽。
 * 读取 comment.liked / likeCount，点击回调 context.props.onLike（乐观更新由 consumer 完成）。
 */
export function createLikePlugin<T = any>(
  config: LikePluginConfig = {}
): CommentPlugin<T> {
  return {
    name: "LikePlugin",
    version: "0.1.0",
    description: "点赞：每条评论的操作行渲染点赞按钮与计数，点击回调 onLike。",
    priority: 40,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <LikeButton
          comment={comment}
          showCount={config.showCount}
          onLike={context.props.onLike as (id: string, next: boolean) => void}
        />
      ),
    },
  };
}

export { doc };
