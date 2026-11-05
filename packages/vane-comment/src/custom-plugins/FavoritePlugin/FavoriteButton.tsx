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
 * 收藏按钮：完全受控（状态只来自 comment.favorited），点击只回调 onFavorite(id, next)。
 * 与 LikePlugin 一致：本地 state 会在服务端拒绝 / 列表刷新后与 props 分叉。
 */
export function FavoriteButton({
  comment,
  onFavorite,
}: {
  comment: Comment;
  onFavorite?: (id: string, next: boolean) => void;
}) {
  const fav = !!comment.favorited;
  const handle = () => {
    onFavorite?.(comment.id, !fav);
  };
  return (
    <button
      type="button"
      data-testid="comment-favorite"
      onClick={handle}
      aria-pressed={fav}
      style={{ ...actionBtn, color: fav ? "#faad14" : "inherit" }}
    >
      {fav ? "★已收藏" : "☆收藏"}
    </button>
  );
}
