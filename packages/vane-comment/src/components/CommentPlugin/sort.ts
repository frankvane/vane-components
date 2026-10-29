import type { Comment, SortMode } from "./plugins/types";

/**
 * 评论列表排序（视图变换，纯函数，幂等）。
 * - newest：创建时间倒序
 * - oldest：创建时间正序
 * - mostLiked：点赞数倒序（并列按时间倒序）
 * - hottest：热度分倒序（并列按时间倒序）
 * - custom：保留传入顺序（不排序）
 */
export function sortComments(
  data: Comment[] | undefined,
  mode: SortMode
): Comment[] {
  if (!data || mode === "custom") return data ?? [];
  const arr = [...data];
  switch (mode) {
    case "newest":
      arr.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "oldest":
      arr.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case "mostLiked":
      arr.sort((a, b) => b.likeCount - a.likeCount || b.createdAt - a.createdAt);
      break;
    case "hottest":
      arr.sort(
        (a, b) =>
          (b.hotScore ?? 0) - (a.hotScore ?? 0) || b.createdAt - a.createdAt
      );
      break;
  }
  return arr;
}

/** 排序模式的中文标签（UI 用） */
export const SORT_LABELS: Record<SortMode, string> = {
  newest: "最新",
  oldest: "最早",
  hottest: "最热",
  mostLiked: "最赞",
  custom: "默认",
};
