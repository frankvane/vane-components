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

/**
 * 置顶按钮：完全受控（状态只来自 comment.pinned），点击只回调 onPin(id, next)。
 * 不用本地 state：置顶被服务端拒绝 / 列表刷新时，props 才是唯一事实来源；
 * 本地态会让按钮与 Core 的「置顶」标显示相反结论（且刷新后仍不回正）。
 */
export function PinButton({
  comment,
  onPin,
}: {
  comment: Comment;
  onPin?: (id: string, next: boolean) => void;
}) {
  const pinned = !!comment.pinned;
  const handle = () => {
    onPin?.(comment.id, !pinned);
  };
  return (
    <button
      type="button"
      data-testid="comment-pin"
      onClick={handle}
      aria-pressed={pinned}
      style={{ ...actionBtn, color: pinned ? "#b35c00" : "inherit" }}
    >
      {pinned ? "📌取消置顶" : "📌置顶"}
    </button>
  );
}
