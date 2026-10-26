import React from "react";
import { NavLink } from "react-router-dom";
import {
  CATEGORY_LABELS,
  PLUGINS_BY_CATEGORY,
  COMBOS,
  ADVANCED,
  Category,
} from "../data/plugin-catalog";

// 新版菜单顺序：应用级入口 + 用户指定的分组顺序
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

// 重点分组渐变高亮
const GRADIENT: Partial<Record<Category, React.CSSProperties>> = {
  ecommerce: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    fontWeight: "bold",
  },
  interaction: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    fontWeight: "bold",
  },
};

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Vane LazyLoadImage</h2>
      <nav className="nav">
        <NavLink to="/" end className="nav-app">
          首页
        </NavLink>
        <NavLink to="/scenarios" className="nav-app">
          场景示例
        </NavLink>
        <NavLink to="/workshop" className="nav-app">
          插件工坊
        </NavLink>

        {GROUP_ORDER.map((cat) => {
          const list = PLUGINS_BY_CATEGORY[cat];
          if (!list || list.length === 0) return null;
          return (
            <div className="nav-group" key={cat}>
              <h3 className="nav-group-title">
                {cat === "ecommerce" ? "🛒 " : cat === "interaction" ? "✨ " : ""}
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="nav-group-items">
                {list.map((p) => (
                  <NavLink
                    key={p.id}
                    to={`/plugin/${p.id}`}
                    className="nav-link"
                    style={GRADIENT[cat]}
                  >
                    {p.title}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}

        <div className="nav-group">
          <h3 className="nav-group-title">🧩 组合示例</h3>
          <div className="nav-group-items">
            {COMBOS.map((c) => (
              <NavLink key={c.id} to={`/combo/${c.id}`} className="nav-link">
                {c.title}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="nav-group">
          <h3 className="nav-group-title">🚀 高级功能</h3>
          <div className="nav-group-items">
            {ADVANCED.map((a) => (
              <NavLink
                key={a.id}
                to={`/advanced/${a.id}`}
                className="nav-link"
                style={{
                  background:
                    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontWeight: "bold",
                }}
              >
                {a.title}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
};
