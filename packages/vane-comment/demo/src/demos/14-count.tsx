import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createCountPlugin } from "vane-comment/custom-plugins/CountPlugin";
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
 * 14 · 计数（插件功能）
 * 只装 CountPlugin：顶栏展示评论总数 + 热议标，读取 context.comments.length。
 * 注意它读的是经 Filter/Search 处理后的结果，叠这两插件时会跟着变。
 */
export const meta: DemoMeta = {
  slug: "count",
  title: "计数",
  group: "plugin",
  plugin: "CountPlugin",
  intro: "顶栏展示评论总数 + 热议标，读取 context.comments.length（随筛选/搜索实时变化）。",
  why: "顶栏的「N 条评论」是评论区标配；读的是处理后的结果，叠筛选/搜索时自动同步。",
  plugs: [{ fn: "createCountPlugin", why: "顶栏评论总数 + 热议标；读 context.comments.length" }],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createCountPlugin()]),
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
        只有计数被装上：顶栏出现「N 条评论」+ 热议标，数字等于当前可见评论数。
      </p>
    </div>
  );
}
