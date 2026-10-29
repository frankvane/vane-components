import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createTimestampPlugin } from "vane-comment/custom-plugins/TimestampPlugin";
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
 * 13 · 绝对时间（插件功能）
 * 只装 TimestampPlugin：Core 默认展示相对时间，本插件在操作行补充「绝对时间」芯片，
 * 便于精确查看发布时刻。无回调。
 */
export const meta: DemoMeta = {
  slug: "timestamp",
  title: "绝对时间",
  group: "plugin",
  plugin: "TimestampPlugin",
  intro: "Core 默认相对时间，本插件补充绝对时间芯片（YYYY-MM-DD HH:mm）。",
  why: "取证/审核场景需要精确到分钟；相对时间继续保留，绝对时间只是补充。",
  plugs: [{ fn: "createTimestampPlugin", why: "操作行补充绝对时间芯片" }],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createTimestampPlugin()]),
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
        只有绝对时间被装上：每条评论操作行多出一串 YYYY-MM-DD HH:mm 精确时间。
      </p>
    </div>
  );
}
