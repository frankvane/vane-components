import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createCopyPlugin } from "vane-comment/custom-plugins/CopyPlugin";
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
 * 08 · 复制（插件功能）
 * 只装 CopyPlugin：操作行出现「📋复制」，点击把评论的纯文本（含 @提及）复制到剪贴板。
 * 无需任何回调，纯前端能力。
 */
export const meta: DemoMeta = {
  slug: "copy",
  title: "复制",
  group: "plugin",
  plugin: "CopyPlugin",
  intro: "操作行加一个复制按钮，把评论纯文本（含 @提及）复制到剪贴板。",
  why: "金句/神回复一键搬运到别处；富文本转纯文本由插件内部处理，消费者零成本。",
  plugs: [{ fn: "createCopyPlugin", why: "操作行复制按钮；富文本转纯文本" }],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createCopyPlugin()]),
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
        只有复制被装上：点操作行的 📋复制，整条评论纯文本写入剪贴板（含 @提及）。
      </p>
    </div>
  );
}
