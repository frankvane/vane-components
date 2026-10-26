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

export const Home: React.FC = () => {
  const total = Object.values(PLUGINS_BY_CATEGORY).reduce(
    (s, l) => s + l.length,
    0
  );
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Vane LazyLoadImage 演示站</h1>
        <p className="page-desc">
          插件化 React 图片懒加载组件库 · 共 {total} 个插件，覆盖电商核心、视觉与效果、
          性能与网络、稳健性与错误处理、视口与交互、可访问性与 SEO 等场景。
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🎛️</div>
          <h3>参数设置（实时预览）</h3>
          <p>每个插件详情页可按 doc.json 配置实时调整参数，立即看到效果。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>配置项（doc.json）</h3>
          <p>73 个插件均带 doc.json，描述、参数、用法一目了然。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎬</div>
          <h3>场景示例</h3>
          <p>虚拟滚动长列表、电商商品网格等真实业务场景组合。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧩</div>
          <h3>插件工坊</h3>
          <p>勾选多个插件实时装配，自动生成组合代码。</p>
        </div>
      </div>

      <h2 className="section-title">按分组浏览</h2>
      <div className="group-grid">
        {GROUP_ORDER.map((cat) => {
          const list = PLUGINS_BY_CATEGORY[cat];
          if (!list || !list.length) return null;
          return (
            <div className="group-card" key={cat}>
              <h3>
                {cat === "ecommerce" ? "🛒 " : cat === "interaction" ? "✨ " : ""}
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
          <h3>🧩 组合示例<span className="count">{COMBOS.length}</span></h3>
          <div className="group-card-items">
            {COMBOS.map((c) => (
              <Link key={c.id} to={`/combo/${c.id}`} className="chip">
                {c.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="group-card">
          <h3>🚀 高级功能<span className="count">{ADVANCED.length}</span></h3>
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
