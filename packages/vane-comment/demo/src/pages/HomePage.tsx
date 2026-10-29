import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";
import type { Comment, CommentNode } from "vane-comment";
import { CodeBlock } from "../components/CodeBlock";
import { COMMENTS, MENTIONS, freshComments } from "../data/sample";
import { SCENARIOS } from "../scenarios/catalog";
import { PLUGINS } from "../data/plugins";
import { DEMOS } from "../demos/registry";

// 组件类型必须在模块级创建（渲染函数里每次调用都会造出新类型 → 重挂载 → 状态丢失）
const HeroComment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["newest", "hottest"], defaultMode: "newest" }),
  createThreadPlugin({ maxDepth: 3 }),
  createRichComposerPlugin({ features: { emoji: true, image: true } }),
]);

const ME = { id: "u-me", name: "我", avatar: undefined };

const QUICK_START = `import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";
import type { Comment, CommentNode } from "vane-comment";

// 1. 装配：一个组件类型，模块顶层调一次
const Comment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["newest", "hottest"], defaultMode: "newest" }),
  createThreadPlugin({ maxDepth: 3 }),
  createRichComposerPlugin({ features: { emoji: true, image: true } }),
]);

// 2. 使用：和普通组件一样
export function CommentZone({ comments }: { comments: Comment[] }) {
  return (
    <Comment
      comments={comments}
      onLike={(id) => console.log("like", id)}
      onReply={(id, content) => console.log("reply", id, content)}
      onSubmit={(content) => console.log("submit", content)}
      mentions={MENTIONS}
    />
  );
}`;

const FEATURES = [
  ["内核只做列表与状态", "列表壳 + 置顶 + 删除态 + 审核态 + 操作行占位内置在内核：数据驱动渲染，能力靠插件增量叠"],
  ["能力都是插件", "17 个领域插件（点赞 / 排序 / 楼中楼 / 富编辑 4 核心 + 13 扩展），不想付的代价不装，不装就没有对应 UI"],
  ["三插槽零改内核", "插件走 vane-plugin-core 现有三槽映射（header / overlay / footer），内核保持 0.1.0 不变"],
  ["四种排序模式", "newest / oldest / hottest / mostLiked 由 SortPlugin 提供，默认模式可配，换排序不用改组件"],
  ["楼中楼递归", "ThreadPlugin 递归嵌套回复，maxDepth 控制折叠深度，深 2~3 视场景而定"],
  ["深层子路径不进根入口", "官方插件走 vane-comment/custom-plugins/<Name>，根入口只含内核与装配器"],
];

const NOTES = [
  ["装配一次", "withCommentPlugins 放模块顶层（纯配置）或 useMemo（工厂要读闭包）。每次渲染都调会造出新组件类型，React 直接卸载重建，用户刚点的赞会被清空。"],
  ["一插件一职责", "17 个插件按 priority 串联，互不覆盖；互动/组织/信息/转化按槽位分工，扩展无上限。"],
  ["子路径不进根入口", "官方插件走 vane-comment/custom-plugins/<Name>，根入口只含 Core + 装配器 + 类型（实测 ≤4KB gzip）。"],
];

export function HomePage() {
  const [comments, setComments] = useState<Comment[]>(() => freshComments());

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

  const stats = [
    { k: `${PLUGINS.length}`, v: "领域插件", s: `${PLUGINS.length} 块 · 按 priority 串联` },
    { k: `${SCENARIOS.length}`, v: "平台场景", s: "每卡两份可复制源码" },
    { k: `${DEMOS.length}`, v: "逐项示例", s: "一插件一页 · 参数可拖" },
    { k: "4", v: "排序模式", s: "newest/oldest/hottest/mostLiked" },
  ];

  return (
    <div>
      <div className="masthead">
        <b>specimen № 05</b>
        <s aria-hidden />
        <span>comment · plugin-composed</span>
        <s aria-hidden />
        <span>
          {PLUGINS.length} plugins / {SCENARIOS.length} plates
        </span>
      </div>

      <section className="hero">
        <h1>
          评论区很简单，
          <em>难的是把点赞、排序、楼中楼、富编辑都塞进一个组件还不膨胀。</em>
        </h1>

        <div className="hero-copy">
          <p className="lede">
            列表与状态渲染（置顶 / 删除 / 审核 / 操作行占位）内置在内核。点赞 / 排序 /
            楼中楼 / 富编辑这些长尾能力做成
            <b>{PLUGINS.length} 个按需插件</b>，用几个装几个——视频、社交、电商各自一套预设，
            内核零改动。
          </p>
          <ul className="feature-list">
            {FEATURES.map(([title, desc], i) => (
              <li key={title}>
                <em aria-hidden>{String(i + 1).padStart(2, "0")}</em>
                <div>
                  <b>{title}</b>
                  <span>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="hero-links">
            <Link to="/demo/like">从「点赞」开始</Link>
            <Link to="/scenarios">看 {SCENARIOS.length} 个平台版式</Link>
          </p>
        </div>

        <figure className="plate hero-demo">
          <figcaption className="plate-cap">
            <b>plate 00</b>
            <span>4 plugins · composed</span>
            <em>live</em>
          </figcaption>
          <div className="plate-ruler" aria-hidden />
          <div className="plate-body">
            <HeroComment
              comments={comments}
              defaultSortMode="newest"
              onLike={onLike}
              onReply={onReply}
              onSubmit={onSubmit}
              onReport={(id) => console.log("举报", id)}
              mentions={MENTIONS}
            />
          </div>
        </figure>
      </section>

      <section className="ledger" aria-label="项目规模">
        {stats.map((s) => (
          <div key={s.v}>
            <b>{s.k}</b>
            <span>{s.v}</span>
            <em>{s.s}</em>
          </div>
        ))}
      </section>

      <section className="two-col">
        <div>
          <div className="section-head">
            <h2>五分钟上手</h2>
            <code>2 steps</code>
          </div>
          <p>
            两步：装配成组件类型，然后当普通组件用。所有长尾行为都来自插件，
            内核的 props 只有数据与回调那几个（comments / onLike / onReply /
            onSubmit / onReport / mentions / defaultSortMode）。
          </p>
          <ul className="notes">
            {NOTES.map(([t, d], i) => (
              <li key={t}>
                <em aria-hidden>{String(i + 1).padStart(2, "0")}</em>
                <span>
                  <b>{t}</b> —— {d}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 14 }}>
            想逐个插件看效果，走{" "}
            <Link to={`/demo/${DEMOS[0].meta.slug}`}>逐项示例</Link>
            （{DEMOS.length} 页：一插件一页，带参数控件与随参数变化的装配代码）。
          </p>
        </div>
        <CodeBlock code={QUICK_START} title="comment-zone.tsx" collapseAfter={0} maxHeight={520} />
      </section>

      <section>
        <div className="section-head">
          <h2>目录</h2>
          <code>contents</code>
        </div>
        <div className="index-list">
          <Link className="index-row" to="/plugins">
            <em>02</em>
            <span>
              <strong>插件工坊</strong>
              <span>勾选 {PLUGINS.length} 个插件，实时看效果并生成装配代码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
          <Link className="index-row" to="/scenarios">
            <em>03</em>
            <span>
              <strong>场景示例</strong>
              <span>{SCENARIOS.length} 个平台版式（视频 / 社交 / 电商 / 自定义），每卡带可复制的完整源码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
          <Link className="index-row" to={`/demo/${DEMOS[0].meta.slug}`}>
            <em>04</em>
            <span>
              <strong>逐项示例</strong>
              <span>{DEMOS.length} 页：一插件一页，带参数控件与随参数变化的装配代码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
        </div>
      </section>
    </div>
  );
}
