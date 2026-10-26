import React from "react";
import { Link } from "react-router-dom";
import {
  PLUGINS_BY_CATEGORY,
  CATEGORY_LABELS,
  COMBOS,
  ADVANCED,
  Category,
} from "../data/plugin-catalog";

const GROUP_ORDER: Category[] = [
  "ecommerce",
  "interaction",
  "visual",
  "perf",
  "robust",
  "viewport",
  "a11y",
  "other",
];

const FEATURES = [
  {
    k: "01",
    t: "参数实时预览",
    d: "每个插件详情页按 doc.json 生成参数面板，改一个值就能看到画面变化。",
  },
  {
    k: "02",
    t: "配置项全量可查",
    d: "每个插件都带 doc.json，参数、类型与默认值写清楚，不用翻源码猜用法。",
  },
  {
    k: "03",
    t: "真实业务场景",
    d: "电商商品网格、虚拟滚动长列表，多插件组合的运行效果。",
  },
  {
    k: "04",
    t: "插件工坊装配",
    d: "勾选多个插件实时组合，自动生成可以直接粘贴的代码。",
  },
];

export const Home: React.FC = () => {
  const total = Object.values(PLUGINS_BY_CATEGORY).reduce(
    (s, l) => s + l.length,
    0
  );
  const groupCount = GROUP_ORDER.filter(
    (c) => (PLUGINS_BY_CATEGORY[c] || []).length > 0
  ).length;

  return (
    <div className="page">
      <section className="hero">
        <span className="hero-mark" aria-hidden="true">
          LAZY
        </span>
        <div>
          <span className="hero-eyebrow">
            <i aria-hidden="true" />
            plugin index · react image pipeline
          </span>
          <h1 className="hero-title">
            <span className="line">图片加载，</span>
            <span className="line">
              交给<em>插件</em>。
            </span>
          </h1>
          <p className="hero-lede">
            插件化 React 图片懒加载组件库的实时演示台：
            <b>{total} 个插件</b>覆盖电商核心、视觉与效果、性能与网络、
            稳健性与错误处理、视口与交互、可访问性与 SEO。每个插件都能在这里
            调参数、看运行时信号、读组合源码。
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/scenarios">
              浏览场景示例
            </Link>
            <Link className="btn btn-ghost" to="/workshop">
              打开插件工坊
            </Link>
          </div>
        </div>

        <div className="hero-stats" role="list" aria-label="内容规模统计">
          <div className="stat" role="listitem">
            <span className="stat-value">{total}</span>
            <span className="stat-label">插件模块</span>
          </div>
          <div className="stat" role="listitem">
            <span className="stat-value">{groupCount}</span>
            <span className="stat-label">功能分组</span>
          </div>
          <div className="stat" role="listitem">
            <span className="stat-value">{COMBOS.length}</span>
            <span className="stat-label">组合方案</span>
          </div>
          <div className="stat" role="listitem">
            <span className="stat-value">{ADVANCED.length}</span>
            <span className="stat-label">高级能力</span>
          </div>
        </div>
      </section>

      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.k}>
            <div className="feature-icon" aria-hidden="true">
              {f.k}
            </div>
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">按分组浏览</h2>
      <div className="group-grid">
        {GROUP_ORDER.map((cat, gi) => {
          const list = PLUGINS_BY_CATEGORY[cat];
          if (!list || !list.length) return null;
          return (
            <div className="group-card" key={cat}>
              <h3>
                <span className="idx">{String(gi + 1).padStart(2, "0")}</span>
                {CATEGORY_LABELS[cat]}
                <span className="count">{list.length}</span>
              </h3>
              <div className="group-card-items">
                {list.map((p) => (
                  <Link key={p.id} to={`/plugin/${p.id}`} className="chip">
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        <div className="group-card">
          <h3>
            组合示例
            <span className="count">{COMBOS.length}</span>
          </h3>
          <div className="group-card-items">
            {COMBOS.map((c) => (
              <Link key={c.id} to={`/combo/${c.id}`} className="chip">
                {c.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="group-card">
          <h3>
            高级功能
            <span className="count">{ADVANCED.length}</span>
          </h3>
          <div className="group-card-items">
            {ADVANCED.map((a) => (
              <Link key={a.id} to={`/advanced/${a.id}`} className="chip">
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
