import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createReportPlugin } from "vane-comment/custom-plugins/ReportPlugin";
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
 * 06 · 举报（插件功能）
 * 只装 ReportPlugin：操作行出现「🚩举报」，点开弹出理由浮层，选理由后提交，
 * 回调 onReport(id, reason) 把「谁举报了什么」摊到日志。
 */
export const meta: DemoMeta = {
  slug: "report",
  title: "举报",
  group: "plugin",
  plugin: "ReportPlugin",
  intro: "操作行加一个举报入口，弹出理由浮层，提交经 onReport(id, reason) 回调。",
  why: "社区治理的底线能力；做成插件后，信任度高的内部场景可以不装，避免误伤正常互动。",
  plugs: [
    { fn: "createReportPlugin", why: "操作行举报按钮；reasons 可自定义理由列表（默认 5 项）" },
  ],
  props: [{ text: "onReport={(id, reason) => { /* 上报后台 */ }}" }],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createReportPlugin()]),
    []
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onReport={(id, reason) => log(`举报 ${id} · ${reason}`)}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onLike={(_id, n) => log(`点赞 ${n ? "取消" : "已点"}`)}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        只有举报被装上：点操作行的 🚩举报，选理由提交，事件写进右侧日志。
      </p>
    </div>
  );
}
