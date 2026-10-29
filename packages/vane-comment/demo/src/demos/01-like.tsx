import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import type { Comment, CommentNode } from "vane-comment";
import type { DemoMeta, DemoStageProps } from "./types";
import { COMMENTS, MENTIONS, freshComments } from "../data/sample";

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
 * 01 · 点赞（插件功能）
 * 只装 LikePlugin：操作行出现点赞按钮，点一下本地计数 +1 并触发缩放动效，
 * 回调 onLike 把「真的点了」摊到事件日志。用 showCount 开关演示配置项。
 */
export const meta: DemoMeta = {
  slug: "like",
  title: "点赞",
  group: "plugin",
  plugin: "LikePlugin",
  intro: "操作行加一个点赞按钮，本地计数 + 缩放回弹动效，事件经 onLike 回调。",
  why: "点赞是评论区最高频的互动；做成插件后，不要点赞的场景（如内部审核台）不装即可。",
  plugs: [
    { fn: "createLikePlugin", cfg: "showCount: {{showCount}}", why: "操作行点赞按钮；showCount 控制是否显示计数" },
  ],
  props: [],
  controls: [
    { key: "showCount", label: "显示计数", kind: "switch", init: true },
  ],
  stageHeight: 420,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const showCount = Boolean(cfg.showCount);

  const onLike = useCallback(
    (id: string) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, liked: !c.liked, likeCount: (c.likeCount ?? 0) + (c.liked ? -1 : 1) }
            : c
        )
      );
      log(`点赞 ${id}`);
    },
    [log]
  );

  // 组件类型随开关重建（改配置 = 重装配）
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createLikePlugin({ showCount })]),
    [showCount]
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onLike={onLike}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onReport={(id) => log(`举报 ${id}`)}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        只有点赞被装上：试试点操作行的 ♥，计数和动效都会变，事件写进右侧日志。
      </p>
    </div>
  );
}
