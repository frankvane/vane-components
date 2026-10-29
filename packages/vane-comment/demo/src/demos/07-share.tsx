import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createSharePlugin } from "vane-comment/custom-plugins/SharePlugin";
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
 * 07 · 分享（插件功能）
 * 只装 SharePlugin：操作行出现「🔗分享」，点击把本条评论的锚点链接复制到剪贴板，
 * 给出「已复制链接」反馈。无需任何回调，纯前端能力。
 */
export const meta: DemoMeta = {
  slug: "share",
  title: "分享",
  group: "plugin",
  plugin: "SharePlugin",
  intro: "操作行加一个分享按钮，复制本条评论锚点链接到剪贴板，给出已复制反馈。",
  why: "把高价值评论（神回复、干货）分享出去是社区裂变的入口；纯前端、无后端依赖，按需装。",
  plugs: [{ fn: "createSharePlugin", why: "操作行分享按钮；复制 #comment-<id> 锚点链接" }],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createSharePlugin()]),
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
        只有分享被装上：点操作行的 🔗分享，链接写入剪贴板并提示「已复制链接」。
      </p>
    </div>
  );
}
