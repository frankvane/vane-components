import React, { useCallback, useState } from "react";
import { createEcommerceComment } from "vane-comment/presets/ecommerce";
import type { Comment, CommentNode } from "vane-comment";
import type { ScenarioMeta } from "./types";
import { MENTIONS, freshComments } from "../data/sample";

/**
 * 03 · 电商评论区（对标淘宝 / 京东 / 拼多多）
 * 预设：点赞 + 排序（最新 / 最赞，默认最新）+ 楼中楼（深 2）+ 富编辑（emoji + 图片晒单）。
 * 电商场景突出「图片晒单」与「最赞」——晒图带图评是转化关键，楼中楼浅一点（深 2）避免刷屏。
 */
export const meta: ScenarioMeta = {
  id: "ecommerce",
  title: "电商评论区",
  group: "电商",
  ref: { label: "淘宝 / 京东 / 拼多多", url: "https://www.taobao.com" },
  pain: "突出图片晒单与「最赞」；楼中楼浅（深 2）避免长评刷屏，聚焦商品评价。",
  plugs: [
    { fn: "createLikePlugin", why: "操作行点赞，好评为商品背书" },
    { fn: "createSortPlugin", cfg: 'modes: ["newest", "mostLiked"], defaultMode: "newest"', why: "排序条两模式，默认最新、可切最赞" },
    { fn: "createThreadPlugin", cfg: "maxDepth: 2", why: "楼中楼浅嵌套（深 2），聚焦主评" },
    { fn: "createRichComposerPlugin", cfg: "features: { emoji: true, image: true }", why: "评论框表情 + 图片晒单（转化关键）" },
  ],
  props: ['defaultSortMode="newest"'],
  note: "电商评论区默认最新、楼中楼浅（深 2）：preset 把 ThreadPlugin 的 maxDepth 设成 2，并把 SortPlugin 限成 newest/mostLiked，避免长评刷屏。",
};

const Comment = createEcommerceComment();
const ME = { id: "u-me", name: "我", avatar: undefined };

export default function EcommerceScenario() {
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
        onReport={(id) => console.log("[ecommerce] 举报", id)}
        mentions={MENTIONS}
      />
    </div>
  );
}
