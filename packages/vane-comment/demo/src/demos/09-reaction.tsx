import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createReactionPlugin } from "vane-comment/custom-plugins/ReactionPlugin";
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
 * 09 · 多表情反应（插件功能）
 * 只装 ReactionPlugin：操作行出现表情反应条（👍❤️😂🎉），点击累加对应计数，
 * 回调 onReact(id, emoji)。这里把计数写回 comments，让反应真正 +1。
 */
export const meta: DemoMeta = {
  slug: "reaction",
  title: "多表情反应",
  group: "plugin",
  plugin: "ReactionPlugin",
  intro: "操作行渲染表情反应条，点击累加计数，回调 onReact(id, emoji)。",
  why: "比「点赞」更轻量也更丰富：用户用表情秒回，不占用评论位；emojis 可自定义。",
  plugs: [
    {
      fn: "createReactionPlugin",
      cfg: 'emojis: ["👍", "❤️", "😂", "🎉"]',
      why: "操作行表情反应条；emojis 自定义表情集合",
    },
  ],
  props: [{ text: "onReact={(id, emoji) => { /* 累加计数 */ }}" }],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createReactionPlugin()]),
    []
  );

  const onReact = useCallback(
    (id: string, emoji: string) => {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const r = { ...(c.reactions ?? {}) };
          r[emoji] = (r[emoji] ?? 0) + 1;
          return { ...c, reactions: r };
        })
      );
      log(`反应 ${id} ${emoji}`);
    },
    [log]
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onReact={onReact}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onLike={(_id) => log("点赞")}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        只有反应被装上：点表情条里的任意表情，计数 +1 并写进右侧日志。
      </p>
    </div>
  );
}
