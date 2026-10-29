import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createSearchPlugin } from "vane-comment/custom-plugins/SearchPlugin";
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
 * 16 · 搜索（插件功能）
 * 只装 SearchPlugin：顶栏出现搜索框，输入关键词经 transformData 按评论纯文本过滤。
 * 数据级插件：不改渲染，只改传给 Core 的数据。
 */
export const meta: DemoMeta = {
  slug: "search",
  title: "搜索",
  group: "plugin",
  plugin: "SearchPlugin",
  intro: "顶栏搜索框，经 transformData 按评论纯文本（含 @提及）过滤。",
  why: "长评论区必须有检索；同样是数据级插件，和筛选/排序叠加时各自独立生效。",
  plugs: [{ fn: "createSearchPlugin", why: "顶栏搜索框；transformData 按 state.query 过滤" }],
  props: [],
  stageHeight: 420,
};

export default function Stage({ log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createSearchPlugin()]),
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
        只有搜索被装上：在顶栏输入「工程文件」「BGM」「SKU」等，列表只留命中的评论。
      </p>
    </div>
  );
}
