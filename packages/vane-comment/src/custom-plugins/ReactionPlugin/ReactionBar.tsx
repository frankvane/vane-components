import React from "react";
import type { Comment } from "../../components/CommentPlugin/plugins/types";

const actionBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  flexShrink: 0,
};

/** 多表情反应条：点击累加对应表情计数，回调 onReact(id, emoji) */
export function ReactionBar({
  comment,
  onReact,
  emojis,
}: {
  comment: Comment;
  onReact?: (id: string, emoji: string) => void;
  emojis: string[];
}) {
  const reactions = comment.reactions ?? {};
  return (
    <span data-testid="comment-reaction" style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
      {emojis.map((e) => {
        const n = reactions[e] ?? 0;
        return (
          <button
            key={e}
            type="button"
            onClick={() => onReact?.(comment.id, e)}
            style={{
              ...actionBtn,
              color: n > 0 ? "#1565c0" : "inherit",
              opacity: n > 0 ? 1 : 0.7,
            }}
          >
            {e}
            {n > 0 ? ` ${n}` : ""}
          </button>
        );
      })}
    </span>
  );
}
