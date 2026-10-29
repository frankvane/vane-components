import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLoginPromptPlugin } from "vane-comment/custom-plugins/LoginPromptPlugin";
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
 * 18 · 未登录引导（插件功能）
 * 只装 LoginPromptPlugin：底部渲染「登录后参与评论」引导条，点击登录回调 onLogin。
 * 与 RichComposerPlugin 同属 renderFooter 槽，可共存（一个引导、一个发评论）。
 */
export const meta: DemoMeta = {
  slug: "login",
  title: "未登录引导",
  group: "plugin",
  plugin: "LoginPromptPlugin",
  intro: "底部渲染登录引导条，点击登录回调 onLogin；与 RichComposer 同槽可共存。",
  why: "未登录态下把评论框换成轻引导，登录后切真框；同槽并联，不抢位。",
  plugs: [{ fn: "createLoginPromptPlugin", why: "底部登录引导；onLogin 回调" }],
  props: [{ text: "onLogin={() => { /* 跳转登录 */ }}" }],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createLoginPromptPlugin()]),
    []
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onLogin={() => log("点击登录 → 跳转登录页")}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onLike={(_id) => log("点赞")}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        只有未登录引导被装上：列表底部出现「登录后参与评论」+ 登录按钮，点击写进日志。
      </p>
    </div>
  );
}
