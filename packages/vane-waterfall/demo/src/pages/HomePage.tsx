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
  ["布局是纯函数", "computeLayout 不碰 DOM，可直接对快照做等价性单测（8 组数字断言）"],
  ["布局钩子有执行点", "calculateColumns / calculateColumnWidth / calculateItemPosition 三处真的会被调用，不是摆设"],
  ["虚拟化只裁渲染", "未渲染项按 estimateHeight 占位，总高不会缩水，滚动条不跳"],
  ["钩子有生命周期", "onMount 返回的清理函数会被执行，监听不会泄漏"],
  ["priority 越大越先", "与旧版语义一致，不做 1000-x 反转"],
  ["插件可单测", "26 个插件都能在 happy-dom 里直接调钩子断言，不需要浏览器"],
];

const NOTES = [
  ["装配一次", "withPlugins 放模块顶层（纯配置）或 useMemo 里（钩子要读闭包）。每次渲染都调会造出新组件类型，React 直接卸载重建。"],
  ["一插件一职责", "26 个插件、20 个钩子。想要什么行为就勾哪个，不想付的代价不装。"],
  ["Core 只做三件事", "测量 / 布局 / 滚动。其余所有「旁边那一堆需求」都在插件里。"],
];

export function HomePage() {
  const stats = [
    { k: `${PLUGINS.length}`, v: "领域插件", s: "5 组 · 按 priority 串联" },
    { k: `${SCENARIOS.length}`, v: "组合场景", s: "每卡两份可复制源码" },
    { k: `${DEMOS.length}`, v: "逐项示例", s: "一插件一页 · 参数可拖" },
    { k: "20", v: "领域钩子", s: "4 生命周期 + 16 业务" },
  ];

  return (
    <div>
      <div className="masthead">
        <b>specimen № 02</b>
        <s aria-hidden />
        <span>masonry · plugin-composed</span>
        <s aria-hidden />
        <span>
          {PLUGINS.length} plugins / {SCENARIOS.length} plates
        </span>
      </div>

      <section className="hero">
        <h1>
          瀑布流本身很简单，
          <em>难的是它旁边那一堆需求。</em>
        </h1>

        <div className="hero-copy">
          <p className="lede">
            可变高、响应式列数、置顶、分组吸顶、拖拽换位、无限加载、千项虚拟化 —— 这些不该揉进一个
            800 行的组件里。vane-waterfall 把它们拆成 <b>{PLUGINS.length} 个领域插件</b>，
            Core 只负责「测量 + 布局 + 滚动」。
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
            <Link to={`/demo/${DEMOS[0].meta.slug}`}>从「基础示例」开始</Link>
            <Link to="/scenarios">看 {SCENARIOS.length} 个真实版式</Link>
          </p>
        </div>

        <figure className="plate hero-demo">
          <figcaption className="plate-cap">
            <b>plate 00</b>
            <span>18 items · auto-column · gap 10</span>
            <em>live</em>
          </figcaption>
          <div className="plate-ruler" aria-hidden />
          <div className="plate-body">
            <HeroWaterfall
              items={HERO_DATA}
              containerStyle={{ height: 424 }}
              keyExtractor={(item) => item.id}
              renderItem={(item) => <FeedCard card={item} variant="plain" />}
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
            两步：装配成组件类型，然后当普通列表用。所有行为都来自插件，Core 的 props
            只有布局相关的那几个。
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
            <Link to={`/demo/${DEMOS[0].meta.slug}`}>逐项示例</Link>（{DEMO_PLUGINS.length} /{" "}
            {PLUGINS.length} 个插件各有一页，另有 ref / 事件 / 基础 props 六页）。
          </p>
        </div>
        <CodeBlock code={QUICK_START} title="feed.tsx" collapseAfter={0} maxHeight={520} />
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
              <span>
                {SCENARIOS.length} 个真实版式（图文 / 电商 / 视频 / 看板…），每卡带可复制的完整源码
              </span>
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
