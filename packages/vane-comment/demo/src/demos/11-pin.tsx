import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createPinPlugin } from "vane-comment/custom-plugins/PinPlugin";
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
 * 11 · 置顶（插件功能）
 * 只装 PinPlugin：操作行出现「📌置顶 / 📌取消置顶」，点击切换，回调 onPin(id, next)；
 * Core 读取 comment.pinned 在顶部渲染置顶标。样例里 c-1 默认已置顶。
 */
export const meta: DemoMeta = {
  slug: "pin",
  title: "置顶",
  group: "plugin",
  plugin: "PinPlugin",
  intro: "操作行加一个置顶按钮，切换回调 onPin(id, next)；Core 读 pinned 渲染置顶标。",
  why: "运营把优质/公告评论钉在顶部；pinned 是数据字段，置顶标由 Core 渲染，插件只管切换。",
  plugs: [{ fn: "createPinPlugin", why: "操作行置顶按钮；onPin(id, nextPinned)；置顶标由 Core 渲染" }],
  props: [{ text: "onPin={(id, next) => { /* 改 pinned 字段 */ }}" }],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createPinPlugin()]),
    []
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onPin={(id, next) => log(`置顶 ${id} → ${next ? "置顶" : "取消"}`)}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onLike={(_id) => log("点赞")}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        只有置顶被装上：c-1 默认已置顶（顶部有标），点 📌可切换并写进日志。
      </p>
    </div>
  );
}
