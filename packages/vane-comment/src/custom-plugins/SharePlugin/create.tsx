import React, { useEffect, useRef, useState } from "react";
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
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  flexShrink: 0,
};

type FlashState = "idle" | "copied" | "failed";

/**
 * 分享按钮：复制本条评论的锚点链接到剪贴板。
 * 与 CopyPlugin 同一套语义：写成功才提示成功，失败给「复制失败」；定时器随卸载清理。
 */
function ShareButton({ comment }: { comment: Comment }) {
  const [state, setState] = useState<FlashState>("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const flash = (next: FlashState) => {
    setState(next);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setState("idle");
    }, 1500);
  };

  const handle = async () => {
    const link = `${typeof location !== "undefined" ? location.origin + location.pathname : ""}#comment-${comment.id}`;
    try {
      const clipboard =
        typeof navigator !== "undefined" ? navigator.clipboard : undefined;
      if (!clipboard?.writeText) throw new Error("clipboard unavailable");
      await clipboard.writeText(link);
      flash("copied");
    } catch {
      flash("failed");
    }
  };
  return (
    <button
      type="button"
      data-testid="comment-share"
      title={state === "failed" ? "复制失败，请手动复制链接" : undefined}
      onClick={() => {
        void handle();
      }}
      style={actionBtn}
    >
      {state === "copied"
        ? "已复制链接"
        : state === "failed"
          ? "复制失败"
          : "🔗分享"}
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
