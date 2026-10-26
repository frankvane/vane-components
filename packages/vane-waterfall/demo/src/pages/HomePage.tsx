import React from "react";
import { Link } from "react-router-dom";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createAutoColumnPlugin,
  createGapPlugin,
  createTransitionPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import { CodeBlock } from "../components/CodeBlock";
import { SCENARIOS } from "../scenarios/catalog";
import { PLUGINS } from "../data/plugins";
import { DEMOS, DEMO_PLUGINS } from "../demos/registry";

const HERO_DATA = makeCards({ count: 18, seed: 2026, heightRange: [120, 220] });

const HeroWaterfall = withPlugins<SeedCard>(WaterfallCore, [
  createAutoColumnPlugin({ minColumnWidth: 110, maxColumns: 4 }),
  createGapPlugin({ columnGap: 10, rowGap: 10 }),
  createTransitionPlugin({ duration: 240 }),
]);

const QUICK_START = `import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createAutoColumnPlugin,
  createGapPlugin,
  createInfiniteScrollPlugin,
} from "vane-waterfall/custom-plugins";

// 1. 装配：一个组件类型，模块顶层调一次
const Waterfall = withPlugins(WaterfallCore, [
  createAutoColumnPlugin({ minColumnWidth: 220, maxColumns: 4 }),
  createGapPlugin({ columnGap: 16, rowGap: 16 }),
  createInfiniteScrollPlugin({ threshold: 400 }),
]);

// 2. 使用：和普通列表组件一样
export function Feed({ items, loadMore }) {
  return (
    <Waterfall
      items={items}
      onLoadMore={loadMore}
      containerStyle={{ height: "100vh" }}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <Card data={item} />}
    />
  );
}`;

const FEATURES = [
  ["布局是纯函数", "computeLayout 不碰 DOM，可以直接对快照做等价性单测（8 组数字断言）"],
  ["布局钩子有执行点", "calculateColumns / calculateColumnWidth / calculateItemPosition 三处真的会被调用，不是摆设"],
  ["虚拟化只裁渲染", "未渲染项按 estimateHeight 占位，总高不会缩水，滚动条不跳"],
  ["钩子有生命周期", "onMount 返回的清理函数会被执行，监听不会泄漏"],
  ["priority 越大越先", "与旧版语义一致，不做 1000-x 反转"],
  ["插件可单测", "26 个插件都能在 happy-dom 里直接调钩子断言，不需要浏览器"],
];

export function HomePage() {
  const stats = [
    { k: `${PLUGINS.length}`, v: "领域插件", s: "5 组 · 按 priority 串联" },
    { k: `${DEMOS.length}`, v: "逐项示例", s: "一插件一页 · 参数可拖" },
    { k: `${SCENARIOS.length}`, v: "组合场景", s: "每卡两份源码" },
    { k: "20", v: "领域钩子", s: "4 生命周期 + 16 业务" },
  ];

  return (
    <div>
      <section className="hero">
        <div>
          <h1>
            瀑布流本身很简单，
            <br />
            难的是它旁边那一堆需求。
          </h1>
          <p>
            可变高、响应式列数、置顶、分组吸顶、拖拽换位、无限加载、千项虚拟化 —— 这些不该
            揉进一个 800 行的组件里。vane-waterfall 把它们拆成 {PLUGINS.length} 个领域插件，
            Core 只负责「测量 + 布局 + 滚动」。
          </p>
          <ul className="feature-list">
            {FEATURES.map(([title, desc]) => (
              <li key={title}>
                <span className="dot" />
                <span>
                  <b>{title}</b> —— {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="hero-links">
            <Link to={`/demo/${DEMOS[0].meta.slug}`}>从「基础示例」开始 →</Link>
            <Link to="/scenarios">看 {SCENARIOS.length} 个真实版式 →</Link>
          </p>
        </div>

        <div className="hero-demo">
          <div className="hero-demo-head">
            <span>实时渲染 · 18 项</span>
            <code>AutoColumn + Gap + Transition</code>
          </div>
          <div className="hero-demo-stage">
            <HeroWaterfall
              items={HERO_DATA}
              containerStyle={{ height: 372 }}
              keyExtractor={(item) => item.id}
              renderItem={(item) => <FeedCard card={item} variant="plain" />}
            />
          </div>
        </div>
      </section>

      <section className="grid-3" style={{ marginBottom: 26 }}>
        {stats.map((s) => (
          <div className="card stat" key={s.v}>
            <strong>{s.k}</strong>
            <span>{s.v}</span>
            <em>{s.s}</em>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 26 }}>
        <h2 className="page-title" style={{ fontSize: 18 }}>
          5 分钟上手
        </h2>
        <p className="page-sub" style={{ marginBottom: 12 }}>
          两步：装配成组件类型，然后当普通列表用。所有行为都来自插件，Core 的 props 只有布局相关的那几个。
          <br />
          想逐个插件看效果，走 <Link to={`/demo/${DEMOS[0].meta.slug}`}>逐项示例</Link>（
          {DEMO_PLUGINS.length} / {PLUGINS.length} 个插件各有一页，另有 ref / 事件 / 基础 props 六页）。
        </p>
        <CodeBlock code={QUICK_START} title="feed.tsx" collapseAfter={0} maxHeight={520} />
      </section>

      <section className="grid-3">
        <Link className="card link-card" to="/plugins">
          <strong>插件工坊 →</strong>
          <span>勾选 {PLUGINS.length} 个插件，实时看效果并生成装配代码</span>
        </Link>
        <Link className="card link-card" to="/scenarios">
          <strong>场景示例 →</strong>
          <span>
            {SCENARIOS.length} 个真实版式（图文 / 电商 / 视频 / 看板…），每卡带可复制的完整源码
          </span>
        </Link>
        <Link className="card link-card" to={`/demo/${DEMOS[0].meta.slug}`}>
          <strong>逐项示例 →</strong>
          <span>
            {DEMOS.length} 页：一插件一页，带参数控件与随参数变化的装配代码
          </span>
        </Link>
      </section>
    </div>
  );
}
