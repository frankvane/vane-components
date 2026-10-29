import React, { useCallback, useState } from "react";
import { createVideoComment } from "vane-comment/presets/video";
import type { Comment, CommentNode } from "vane-comment";
import type { ScenarioMeta } from "./types";
import { MENTIONS, freshComments } from "../data/sample";

/**
 * 01 · 视频评论区（对标抖音 / B站 / 视频号）
 * 预设：点赞 + 排序（最热/最新，默认最热）+ 楼中楼（深 3）+ 富编辑（emoji + 图片）。
 * 视频场景默认按最热排序，鼓励高赞评论浮顶。
 */
export const meta: ScenarioMeta = {
  id: "video",
  title: "视频评论区",
  group: "视频",
  ref: { label: "抖音 / B站 / 视频号", url: "https://www.bilibili.com" },
  pain: "默认按最热排序，高赞神评浮顶；支持楼中楼与图片晒梗。",
  plugs: [
    { fn: "createLikePlugin", why: "操作行点赞，双击视频也触发同一条" },
    { fn: "createSortPlugin", cfg: 'modes: ["hottest", "newest"], defaultMode: "hottest"', why: "顶栏排序条，默认最热" },
    { fn: "createThreadPlugin", cfg: "maxDepth: 3", why: "楼中楼递归嵌套，深 3 折叠" },
    { fn: "createRichComposerPlugin", cfg: "features: { emoji: true, image: true }", why: "评论框表情 + 图片（晒梗图）" },
  ],
  props: ['defaultSortMode="hottest"'],
  note: "视频评论区默认最热：同一内核，只是 preset 把 SortPlugin 的 defaultMode 设成 hottest。换排序不需要改组件。",
};

const Comment = createVideoComment();
const ME = { id: "u-me", name: "我", avatar: undefined };

export default function VideoScenario() {
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
        defaultSortMode="hottest"
        onLike={onLike}
        onReply={onReply}
        onSubmit={onSubmit}
        onReport={(id) => console.log("[video] 举报", id)}
        mentions={MENTIONS}
      />
    </div>
  );
}
