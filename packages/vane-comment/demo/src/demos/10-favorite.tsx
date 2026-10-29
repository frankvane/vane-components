import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createFavoritePlugin } from "vane-comment/custom-plugins/FavoritePlugin";
import type { Comment, CommentNode } from "vane-comment";
import type { DemoMeta, DemoStageProps } from "./types";
import { freshComments, MENTIONS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  color: "#1f2328",
  width: "100%",
  maxWidth: 560,
  margin: "0 auto",
};

/**
 * 10 · 收藏（插件功能）
 * 只装 FavoritePlugin：操作行出现「☆收藏 / ★已收藏」，点击切换高亮，
 * 回调 onFavorite(id, next)。高亮状态由插件本地维护。
 */
export const meta: DemoMeta = {
  slug: "favorite",
  title: "收藏",
  group: "plugin",
  plugin: "FavoritePlugin",
  intro: "操作行加一个收藏按钮，点击切换 ☆/★ 高亮，回调 onFavorite(id, next)。",
  why: "用户把有用评论收进个人收藏夹；状态本地切换，上报交给 onFavorite。",
  plugs: [{ fn: "createFavoritePlugin", why: "操作行收藏按钮；onFavorite(id, nextFavorited)" }],
  props: [{ text: "onFavorite={(id, next) => { /* 写收藏夹 */ }}" }],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createFavoritePlugin()]),
    []
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onFavorite={(id, next) => log(`收藏 ${id} → ${next ? "已收藏" : "取消"}`)}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onLike={(_id) => log("点赞")}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        只有收藏被装上：点操作行的 ☆，变 ★ 并写进右侧日志。
      </p>
    </div>
  );
}
