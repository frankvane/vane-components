import React, { useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createModerationPlugin } from "vane-comment/custom-plugins/ModerationPlugin";
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
 * 17 · 审核（插件功能）
 * 只装 ModerationPlugin：数据级插件，经 transformData 把敏感词（广告/加微信…）替换为 **，
 * 并默认过滤待审/已删评论。这里把第一条评论改成含敏感词，直观看到脱敏效果。
 * 开关「过滤待审/已删」会重建插件：关掉后 c-3（待审）、c-4（已删）也会显示出来。
 */
export const meta: DemoMeta = {
  slug: "moderation",
  title: "审核",
  group: "plugin",
  plugin: "ModerationPlugin",
  intro: "数据级审核：敏感词脱敏（**）+ 过滤待审/已删；不渲染任何 UI。",
  why: "合规前置在数据层，一次装配全列表生效；不渲染 UI，性能零负担。",
  plugs: [
    {
      fn: "createModerationPlugin",
      cfg: "hidePending: {{hidePending}}",
      why: "transformData 脱敏 + 过滤；hidePending 默认 true",
    },
  ],
  props: [],
  controls: [
    { key: "hidePending", label: "过滤待审/已删", kind: "switch", init: true },
  ],
  stageHeight: 460,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const [comments, setComments] = useState<Comment[]>(() =>
    freshComments().map((c) =>
      c.id === "c-1"
        ? { ...c, content: [{ type: "text", value: "这期广告太多，加微信领福利的私我" }] }
        : c
    )
  );
  const hidePending = Boolean(cfg.hidePending);

  const Comment = useMemo(
    () => withCommentPlugins(CommentCore, [createModerationPlugin({ hidePending })]),
    [hidePending]
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
        只有审核被装上：第一条里的「广告」「加微信」被脱敏成 **；关掉开关后待审/已删也会显示。
      </p>
    </div>
  );
}
