import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
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

const ME = { id: "u-me", name: "我", avatar: undefined };

const DEPTH_OPTIONS = [
  { label: "1 层", value: "1" },
  { label: "2 层", value: "2" },
  { label: "3 层", value: "3" },
];

/**
 * 03 · 楼中楼（插件功能）
 * 只装 ThreadPlugin：顶评论的「回复」唤起内联回复框，嵌套回复递归渲染并限深折叠。
 * 用 maxDepth 开关演示嵌套深度。嵌套回复复用同一组槽——子回复也能点赞 / 继续回复。
 */
export const meta: DemoMeta = {
  slug: "thread",
  title: "楼中楼",
  group: "plugin",
  plugin: "ThreadPlugin",
  intro: "操作行的「回复」唤起内联框，嵌套回复递归渲染、限深折叠；子回复同样走点赞 / 继续回复。",
  why: "社交与视频评论区离不开楼中楼；限深避免无限嵌套把版面撑爆。",
  plugs: [
    { fn: "createThreadPlugin", cfg: "maxDepth: {{maxDepth}}", why: "renderNested 递归渲染 replies；maxDepth 控制嵌套上限" },
  ],
  props: [],
  controls: [
    { key: "maxDepth", label: "嵌套深度", kind: "select", init: "3", options: DEPTH_OPTIONS },
  ],
  stageHeight: 460,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const maxDepth = Number(cfg.maxDepth) || 3;

  const onLike = useCallback(
    (id: string) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, liked: !c.liked, likeCount: (c.likeCount ?? 0) + (c.liked ? -1 : 1) }
            : c
        )
      );
    },
    []
  );

  const onReply = useCallback((parentId: string, content: CommentNode[]) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? {
              ...c,
              replies: [
                {
                  id: `${parentId}-r${Date.now()}`,
                  author: ME,
                  content,
                  createdAt: Date.now(),
                  likeCount: 0,
                  liked: false,
                },
                ...(c.replies ?? []),
              ],
              replyCount: (c.replyCount ?? 0) + 1,
            }
          : c
      )
    );
    log(`回复 ${parentId}`);
  }, [log]);

  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createThreadPlugin({ maxDepth })]),
    [maxDepth]
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onLike={onLike}
        onReply={onReply}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onReport={(id) => log(`举报 ${id}`)}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        点任意评论的「回复」会弹出内联框；嵌套回复点开可看，深度由控件控制。
      </p>
    </div>
  );
}
