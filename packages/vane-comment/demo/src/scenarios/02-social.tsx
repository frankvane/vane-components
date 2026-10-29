import React, { useCallback, useState } from "react";
import { createSocialComment } from "vane-comment/presets/social";
import type { Comment, CommentNode } from "vane-comment";
import type { ScenarioMeta } from "./types";
import { MENTIONS, freshComments } from "../data/sample";

/**
 * 02 · 社交评论区（对标微博 / 朋友圈 / 小红书）
 * 预设：点赞 + 排序（全模式，默认最新）+ 楼中楼（深 3）+ 富编辑（emoji + 图片 + @提及）。
 * 社交场景默认按最新排序，鼓励即时互动；@提及是社交传播的关键能力。
 */
export const meta: ScenarioMeta = {
  id: "social",
  title: "社交评论区",
  group: "社交",
  ref: { label: "微博 / 朋友圈 / 小红书", url: "https://weibo.com" },
  pain: "默认按最新排序，@提及与表情是社交传播关键；楼中楼承载对话。",
  plugs: [
    { fn: "createLikePlugin", why: "操作行点赞，社交反馈即时上头" },
    { fn: "createSortPlugin", cfg: 'modes: ["newest", "oldest", "hottest", "mostLiked"], defaultMode: "newest"', why: "排序条四模式，默认最新" },
    { fn: "createThreadPlugin", cfg: "maxDepth: 3", why: "楼中楼递归嵌套，深 3 折叠" },
    { fn: "createRichComposerPlugin", cfg: "features: { emoji: true, image: true, mention: true }", why: "评论框表情 + 图片 + @提及（社交传播）" },
  ],
  props: ['defaultSortMode="newest"', "mentions={MENTIONS}"],
  note: "社交评论区默认最新：preset 把 SortPlugin 的 defaultMode 设成 newest，并打开 mention 能力。换场景只是换 preset，内核不动。",
};

const Comment = createSocialComment();
const ME = { id: "u-me", name: "我", avatar: undefined };

export default function SocialScenario() {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());

  const onLike = useCallback(
    (id: string) =>
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, liked: !c.liked, likeCount: (c.likeCount ?? 0) + (c.liked ? -1 : 1) }
            : c
        )
      ),
    []
  );
  const onReply = useCallback(
    (parentId: string, content: CommentNode[]) =>
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: [
                  { id: `${parentId}-r${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
                  ...(c.replies ?? []),
                ],
                replyCount: (c.replyCount ?? 0) + 1,
              }
            : c
        )
      ),
    []
  );
  const onSubmit = useCallback(
    (content: CommentNode[]) =>
      setComments((prev) => [
        { id: `c-${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
        ...prev,
      ]),
    []
  );

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: "#fff",
        padding: 16,
        borderRadius: 8,
        color: "#1f2328",
      }}
    >
      <Comment
        comments={comments}
        defaultSortMode="newest"
        onLike={onLike}
        onReply={onReply}
        onSubmit={onSubmit}
        onReport={(id) => console.log("[social] 举报", id)}
        mentions={MENTIONS}
      />
    </div>
  );
}
