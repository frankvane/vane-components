import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLocationPlugin } from "vane-comment/custom-plugins/LocationPlugin";
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
 * 12 · 地理位置（插件功能）
 * 只装 LocationPlugin：评论含 location 时，操作行补充 📍 标。这里给第二条评论注入 location。
 * Core 本身不渲染 location，由本插件补充展示。
 */
export const meta: DemoMeta = {
  slug: "location",
  title: "地理位置",
  group: "plugin",
  plugin: "LocationPlugin",
  intro: "评论含 location 时，操作行补充 📍 位置标（Core 不渲染，由插件补充）。",
  why: "本地生活/探店场景需要把「在哪发的」亮出来；无 location 的评论自动不显示，零负担。",
  plugs: [{ fn: "createLocationPlugin", why: "操作行展示 location；评论无 location 时不渲染" }],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() =>
    freshComments().map((c, i) => (i === 1 ? { ...c, location: "上海·静安" } : c))
  );
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createLocationPlugin()]),
    []
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onLike={(_id) => log("点赞")}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        只有地理位置被装上：第二条评论带了 location，操作行出现 📍上海·静安；其余不显示。
      </p>
    </div>
  );
}
