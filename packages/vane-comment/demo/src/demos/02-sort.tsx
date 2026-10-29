import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import type { Comment, CommentNode, SortMode } from "vane-comment";
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

const MODE_OPTIONS = [
  { label: "最新", value: "newest" },
  { label: "最早", value: "oldest" },
  { label: "最热", value: "hottest" },
  { label: "点赞最多", value: "mostLiked" },
];

/**
 * 02 · 排序（插件功能）
 * 只装 SortPlugin：顶栏出现排序条（最新/最早/最热/点赞最多），切换后列表实时重排。
 * 用 defaultSortMode 开关演示初始排序。
 */
export const meta: DemoMeta = {
  slug: "sort",
  title: "排序",
  group: "plugin",
  plugin: "SortPlugin",
  intro: "顶栏排序条：最新 / 最早 / 最热 / 点赞最多，切换即重排，纯函数排序不碰 DOM。",
  why: "视频和电商都重度依赖排序（最热优先 vs 最新优先），但内部后台只想看最新——做成插件按需装配。",
  plugs: [
    { fn: "createSortPlugin", why: "顶栏排序条；默认三种模式，可传 modes 与 defaultMode 裁剪" },
  ],
  props: ['defaultSortMode="newest"'],
  controls: [
    { key: "mode", label: "初始排序", kind: "select", init: "newest", options: MODE_OPTIONS },
  ],
  stageHeight: 420,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const mode = (cfg.mode as SortMode) || "newest";

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

  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createSortPlugin()]),
    []
  );

  return (
    <div style={CARD}>
      <Comment
        comments={comments}
        defaultSortMode={mode}
        onLike={onLike}
        onReply={(_id, _c: CommentNode[]) => log("回复（需叠 ThreadPlugin）")}
        onSubmit={(_c: CommentNode[]) => log("发布（需叠 RichComposerPlugin）")}
        onReport={(id) => log(`举报 ${id}`)}
        mentions={MENTIONS}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        顶栏多了排序条：点「最热」后点赞多的评论会浮上来。初始排序由控件决定。
      </p>
    </div>
  );
}
