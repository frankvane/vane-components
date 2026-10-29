import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";
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

/**
 * 04 · 富编辑（插件功能）
 * 只装 RichComposerPlugin：底部出现评论框，支持 emoji 选择器 / 图片（DataURL）/ @提及，
 * 输出结构化 CommentNode[] 回调 onSubmit。用三个开关裁剪能力。
 */
export const meta: DemoMeta = {
  slug: "rich-composer",
  title: "富编辑",
  group: "plugin",
  plugin: "RichComposerPlugin",
  intro: "底部评论框：emoji 选择器 + 图片 + @提及，输出结构化富内容，实时预览。",
  why: "社交平台要表情和提及，电商要晒图评价——但后台回复框只想要纯文本，做成插件按需开关。",
  plugs: [
    {
      fn: "createRichComposerPlugin",
      cfg: "features: { emoji: {{withEmoji}}, image: {{withImage}}, mention: {{withMention}} }",
      why: "renderFooter 评论框；features 裁剪 emoji / 图片 / @提及",
    },
  ],
  props: [],
  controls: [
    { key: "withEmoji", label: "emoji", kind: "switch", init: true },
    { key: "withImage", label: "图片", kind: "switch", init: true },
    { key: "withMention", label: "@提及", kind: "switch", init: true },
  ],
  stageHeight: 460,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const withEmoji = Boolean(cfg.withEmoji);
  const withImage = Boolean(cfg.withImage);
  const withMention = Boolean(cfg.withMention);

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

  const onSubmit = useCallback(
    (content: CommentNode[]) => {
      if (!content.some((n) => (n.type === "text" && n.value.trim()) || n.type === "image" || n.type === "mention")) {
        return;
      }
      setComments((prev) => [
        { id: `c-${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
        ...prev,
      ]);
      log("发布评论");
    },
    [log]
  );

  const Comment = useMemo(
    () =>
      withCommentPlugins(CommentCore, [
        createRichComposerPlugin({
          features: { emoji: withEmoji, image: withImage, mention: withMention },
        }),
      ]),
    [withEmoji, withImage, withMention]
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        onLike={onLike}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={onSubmit}
        onReport={(id) => log(`举报 ${id}`)}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        底部评论框：点 😊 选表情、🖼️ 传图、@ 提及好友，下方实时预览，发布后新评论置顶。
      </p>
    </div>
  );
}
