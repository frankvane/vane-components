import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
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
 * 00 · 最小评论列表（基础功能）
 * 裸 Core 起步：列表壳 + 排序 + 操作行占位，一个插件都不装。
 * 这是后续每个能力页的起点——能力全靠插件往上叠。
 */
export const meta: DemoMeta = {
  slug: "quickstart",
  title: "最小评论列表",
  group: "basic",
  capability: "core-list",
  intro: "5 行装配出能跑的评论列表：Core 只做数据驱动渲染，能力靠插件增量叠加。",
  why: "先跑通内核，再按需叠点赞 / 排序 / 楼中楼 / 富编辑——评论区的长尾需求多，全塞进内核只会越来越难改。",
  plugs: [],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());

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

  // 裸 Core 没有点赞/回复 UI，但把回调接上，叠了插件就能直接用
  const Comment = useMemo(() => withCommentPlugins(CommentCore, []), []);

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
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        这是裸 Core：列表 / 置顶 / 删除态 / 审核态都内置，但点赞、排序、楼中楼、评论框要叠插件才有。
      </p>
    </div>
  );
}
