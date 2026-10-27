import React from "react";
import { Link } from "react-router-dom";
import { CardCore, withPlugins } from "vane-card";
import {
  createActionsPlugin,
  createBadgePlugin,
  createHoverPlugin,
  createImagePlugin,
  createPriceCalculatorPlugin,
} from "vane-card/custom-plugins";
import { CodeBlock } from "../components/CodeBlock";
import { TEE } from "../data/seed";
import { PLUGINS } from "../data/plugins";
import { SCENARIOS } from "../scenarios/catalog";
import { DEMOS, DEMO_PLUGINS, DEMO_GROUPS } from "../demos/registry";

const HeroCard = withPlugins(CardCore, {
  plugins: [
    createImagePlugin({ alt: TEE.title }),
    createBadgePlugin({ text: "甄选", type: "premium" }),
    createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
    createHoverPlugin({ enableScale: true }),
    createActionsPlugin(),
  ],
});

const QUICK_START = `import { CardCore, withPlugins } from "vane-card";
import {
  createImagePlugin,
  createBadgePlugin,
  createPriceCalculatorPlugin,
  createActionsPlugin,
} from "vane-card/custom-plugins";

// 1. 装配：插件数组 → 一个组件类型（模块顶层调一次）
const ProductCard = withPlugins(CardCore, {
  plugins: [
    createImagePlugin(),
    createBadgePlugin({ text: "甄选" }),
    createPriceCalculatorPlugin({ showDiscount: true }),
    createActionsPlugin(),
  ],
});

// 2. 使用：当普通组件用，行为全在插件里
export function Card({ product }) {
  return (
    <ProductCard cardId={product.id} data={product} padding={0}>
      <h3>{product.title}</h3>
    </ProductCard>
  );
}`;

const FEATURES: Array<[string, string]> = [
  ["Core 只有四件事", "容器、padding、四个回调、一个 ref。其余全是插件 —— 不装就不付费。"],
  ["15 个钩子，不是 24 个", "删掉 9 个没人实现的死钩子，留下的每个都有真实触发点与单测。"],
  ["总线是唯一的耦合", "SKU 写 sku.price，价格插件读它。插件之间不 import 彼此。"],
  ["38 个复合组件", "不想装插件时，用 ProductCard 的零件直接拼版式（子路径按需引入）。"],
  ["样式可拆", "`vane-card/style.css` 24.8KB / gzip 5.1KB；不引也能渲染，只是没皮肤。"],
  ["根入口 6.8KB", "插件、复合组件、配方都走子路径，官方加插件不会让你的包变大。"],
];

const NOTES: Array<[string, string]> = [
  ["装配一次", "withPlugins 放模块顶层（纯配置）或 useMemo 里（要读闭包）。每次渲染都调会造出新组件类型，React 直接卸载重建。"],
  ["一插件一职责", "22 个插件、15 个钩子。想要什么行为就装哪个；不想要的价格计算、比价、券都不是默认项。"],
  ["改行为先看总线", "插件之间只通过 6 个总线键通信（sku.selection / sku.variant / sku.price / sku.image / quantity / coupon.applied）。"],
];

export function HomePage() {
  const stats = [
    { k: String(PLUGINS.length), v: "领域插件", s: "5 组 · 按 priority 串联" },
    { k: String(SCENARIOS.length), v: "组合场景", s: "每卡两份可复制源码" },
    { k: String(DEMOS.length), v: "逐项示例", s: "一插件一页 · 参数可拖" },
    { k: "15", v: "插件钩子", s: "内核 9 + 领域 6" },
  ];

  return (
    <div>
      <div className="masthead">
        <b>specimen № 03</b>
        <s aria-hidden />
        <span>card · plugin-composed</span>
        <s aria-hidden />
        <span>
          {PLUGINS.length} plugins / {SCENARIOS.length} plates
        </span>
      </div>

      <section className="hero">
        <h1>
          卡片本身很简单，
          <em>难的是它旁边那一堆需求。</em>
        </h1>

        <div className="hero-copy">
          <p className="lede">
            选规格、算到手价、比价、领券、低库存告警、倒计时、埋点、无障碍 —— 这些不该揉进一个
            上千行的组件里。vane-card 把它们拆成 <b>{PLUGINS.length} 个领域插件</b>，
            Core 只负责「容器 + 生命周期 + ref」。
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
            <Link to={`/demos/core-props`}>从「Core props」开始</Link>
            <Link to="/scenarios">看 {SCENARIOS.length} 个真实场景</Link>
          </p>
        </div>

        <figure className="plate hero-demo" data-demo="hero">
          <figcaption className="plate-cap">
            <b>plate 00</b>
            <span>5 plugins · live</span>
            <em>live</em>
          </figcaption>
          <div className="plate-ruler" aria-hidden />
          <div className="plate-body plate-body--paper">
            <div className="hero-card">
              <HeroCard cardId="hero" data={TEE} padding={0}>
                <div className="stage-content">
                  <div className="stage-title">{TEE.title}</div>
                  <div className="stage-sub">{TEE.subtitle}</div>
                </div>
              </HeroCard>
            </div>
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
            两步：把插件数组装配成组件类型，然后当普通组件用。和 1.x 的唯一区别是 ——
            你需要显式选择要哪些行为，而不是全都要。
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
            想逐个插件看效果，走 <Link to={`/demos/${DEMOS[0].meta.slug}`}>逐项示例</Link>（
            {DEMO_PLUGINS.length} / {PLUGINS.length} 个插件各有一页，另有 Core 与复合组件共{" "}
            {DEMOS.length} 页）。
          </p>
        </div>
        <CodeBlock code={QUICK_START} title="product-card.tsx" collapseAfter={0} maxHeight={520} />
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
              <span>{SCENARIOS.length} 个真实版式（列表 / 商详 / 交易 / 内容），每卡带可复制的完整源码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
          <Link className="index-row" to={`/demos/${DEMOS[0].meta.slug}`}>
            <em>04</em>
            <span>
              <strong>逐项示例</strong>
              <span>
                {DEMOS.length} 页 / {DEMO_GROUPS.length} 组：一插件一页，带参数控件与随参数变化的装配代码
              </span>
            </span>
            <i aria-hidden>→</i>
          </Link>
        </div>
      </section>
    </div>
  );
}
