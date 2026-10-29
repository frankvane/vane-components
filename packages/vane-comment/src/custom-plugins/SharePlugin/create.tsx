import React, { useState } from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

const actionBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "inherit",
  opacity: 0.7,
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  flexShrink: 0,
};

/** 分享按钮：复制本条评论的锚点链接到剪贴板，给出「已复制」反馈 */
function ShareButton({ comment }: { comment: Comment }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const link = `${typeof location !== "undefined" ? location.origin + location.pathname : ""}#comment-${comment.id}`;
    try {
      await navigator.clipboard?.writeText(link);
    } catch {
      /* 剪贴板不可用时静默 */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      data-testid="comment-share"
      onClick={handle}
      style={actionBtn}
    >
      {copied ? "已复制链接" : "🔗分享"}
    </button>
  );
}

/**
 * SharePlugin - 分享：每条评论操作行渲染分享按钮，复制锚点链接。
 */
export function createSharePlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "SharePlugin",
    version: "0.1.0",
    description: "分享：每条评论操作行渲染分享按钮，复制本条评论锚点链接到剪贴板。",
    priority: 23,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => <ShareButton comment={comment} />,
    },
  };
}

export { doc };
