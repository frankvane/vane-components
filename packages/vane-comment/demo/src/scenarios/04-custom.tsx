import React, { useCallback, useMemo, useState } from "react";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";
import type { Comment, CommentNode } from "vane-comment";
import type { ScenarioMeta } from "./types";
import { MENTIONS, freshComments } from "../data/sample";

/**
 * 04 · 自定义装配（不套预设，自己挑插件）
 * 同一内核，手动 withCommentPlugins 挑插件 —— 演示「要不要点赞 / 排序 / 楼中楼 / 富编辑」
 * 完全由你决定。这里用勾选切换，实时重建组件类型，暴露装配 API 的真容。
 */
export const meta: ScenarioMeta = {
  id: "custom",
  title: "自定义装配",
  group: "通用",
  ref: { label: "任意平台 / 私有化", url: "https://www.workbuddy.cn" },
  pain: "不想套预设？手动挑插件即可——评论区的长尾需求多，用几个装几个，内核零负担。",
  plugs: [
    { fn: "createLikePlugin", why: "勾上才有操作行点赞" },
    { fn: "createSortPlugin", cfg: 'modes: ["newest", "hottest"]', why: "勾上才有排序条" },
    { fn: "createThreadPlugin", cfg: "maxDepth: 3", why: "勾上才有楼中楼" },
    { fn: "createRichComposerPlugin", cfg: "features: { emoji: true }", why: "勾上才有富评论框" },
  ],
  props: ['defaultSortMode="newest"'],
  note: "自定义装配与预设的唯一区别：预设是「一组写好的 withCommentPlugins 调用」。不想套预设，把这一页的勾选逻辑搬进你的项目即可，内核与插件完全复用。",
};

const MAKERS = {
  like: () => createLikePlugin(),
  sort: () => createSortPlugin({ modes: ["newest", "hottest"] }),
  thread: () => createThreadPlugin({ maxDepth: 3 }),
  rich: () => createRichComposerPlugin({ features: { emoji: true } }),
} as const;

type Key = keyof typeof MAKERS;

const OPTIONS: Array<{ key: Key; label: string }> = [
  { key: "like", label: "点赞 LikePlugin" },
  { key: "sort", label: "排序 SortPlugin" },
  { key: "thread", label: "楼中楼 ThreadPlugin" },
  { key: "rich", label: "富编辑 RichComposerPlugin" },
];

const ME = { id: "u-me", name: "我", avatar: undefined };

export default function CustomScenario() {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());
  const [on, setOn] = useState<Record<Key, boolean>>({
    like: true,
    sort: true,
    thread: true,
    rich: false,
  });

  // 按勾选重建组件类型：和插件工坊同一套路（避免每次渲染造新类型导致状态丢失）
  const key = (Object.keys(on) as Key[])
    .filter((k) => on[k])
    .sort()
    .join("|");
  const CommentC = useMemo(() => {
    const plugins = (Object.keys(on) as Key[])
      .filter((k) => on[k])
      .map((k) => MAKERS[k]());
    return withCommentPlugins(CommentCore, plugins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const onLike = useCallback(
    (id: string) =>
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, liked: !c.liked, likeCount: (c.likeCount ?? 0) + (c.liked ? -1 : 1) }
            : c
        )
      ),
    []
  );
  const onReply = useCallback(
    (parentId: string, content: CommentNode[]) =>
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: [
                  { id: `${parentId}-r${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
                  ...(c.replies ?? []),
                ],
                replyCount: (c.replyCount ?? 0) + 1,
              }
            : c
        )
      ),
    []
  );
  const onSubmit = useCallback(
    (content: CommentNode[]) =>
      setComments((prev) => [
        { id: `c-${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
        ...prev,
      ]),
    []
  );

  const toggle = (k: Key) => setOn((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: "#fff",
        padding: 16,
        borderRadius: 8,
        color: "#1f2328",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {OPTIONS.map((o) => (
          <label
            key={o.key}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              border: "1px solid #d0d7de",
              borderRadius: 6,
              cursor: "pointer",
              background: on[o.key] ? "#eef5ff" : "#fff",
            }}
          >
            <input
              type="checkbox"
              checked={on[o.key]}
              onChange={() => toggle(o.key)}
              style={{ marginRight: 6 }}
            />
            {o.label}
          </label>
        ))}
      </div>

      <CommentC
        comments={comments}
        defaultSortMode="newest"
        onLike={onLike}
        onReply={onReply}
        onSubmit={onSubmit}
        onReport={(id) => console.log("[custom] 举报", id)}
        mentions={MENTIONS}
      />
    </div>
  );
}
