import type { Comment } from "../../components/CommentPlugin/plugins/types";

/** 评论纯文本抽取（用于搜索匹配） */
export function toText(comment: Comment): string {
  const parts: string[] = [];
  (comment.content ?? []).forEach((n) => {
    if (n.type === "text") parts.push(n.value);
    else if (n.type === "mention") parts.push(n.name);
  });
  if (comment.text) parts.push(comment.text);
  return parts.join(" ");
}
