import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createFilterPlugin } from "vane-comment/custom-plugins/FilterPlugin";
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
 * 15 · 筛选（插件功能）
 * 只装 FilterPlugin：顶栏出现「全部 / 有图 / 有回复」胶囊，点击经 transformData 过滤列表。
 * 这是数据级插件：它不渲染评论，只改传给 Core 的数据。
 */
export const meta: DemoMeta = {
  slug: "filter",
  title: "筛选",
  group: "plugin",
  plugin: "FilterPlugin",
  intro: "顶栏筛选胶囊（全部/有图/有回复），经 transformData 过滤评论列表。",
  why: "信息流太长时给读者一个快速收敛的入口；过滤在数据层做，不碰渲染，和排序天然共存。",
  plugs: [
    {
      fn: "createFilterPlugin",
      cfg: 'options: ["all", "image", "replies"]',
      why: "顶栏筛选；transformData 按 state.filter 过滤",
    },
  ],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createFilterPlugin()]),
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
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        只有筛选被装上：点顶栏「有图」只剩带图的评论，「有回复」只剩带楼中楼的，列表实时收缩。
      </p>
    </div>
  );
}
