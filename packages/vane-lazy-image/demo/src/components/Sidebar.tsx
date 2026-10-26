import React from "react";
import { NavLink } from "react-router-dom";
import {
  CATEGORY_LABELS,
  PLUGINS_BY_CATEGORY,
  COMBOS,
  ADVANCED,
  Category,
} from "../data/plugin-catalog";

// 菜单顺序：应用级入口 + 分组顺序
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

// 重点分组只用一个色标，不再给整条链接铺渐变底色
const HOT: Category[] = ["ecommerce", "interaction"];

export const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const match = (title: string, id: string) =>
    !q || title.toLowerCase().includes(q) || id.toLowerCase().includes(q);

  return (
    <aside className="sidebar" data-open={open} aria-label="插件导航">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          V
        </span>
        <span className="brand-text">
          <span className="brand-name">VANE LAZY-IMAGE</span>
          <span className="brand-meta">plugin index · v2</span>
        </span>
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="关闭导航菜单"
        >
          ✕
        </button>
      </div>

      <div className="nav-search">
        <input
          className="nav-search-input"
          type="search"
          value={query}
          placeholder="筛选插件…"
          aria-label="按名称筛选插件"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

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

        {GROUP_ORDER.map((cat, gi) => {
          const all = PLUGINS_BY_CATEGORY[cat];
          if (!all || all.length === 0) return null;
          const list = all.filter((p) => match(p.title, p.id));
          if (list.length === 0) return null;
          return (
            <div
              className={`nav-group${HOT.includes(cat) ? " is-hot" : ""}`}
              key={cat}
            >
              <h3 className="nav-group-title">
                <span className="idx">
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <span className="sub">{CATEGORY_LABELS[cat]}</span>
                <span className="count">{list.length}</span>
              </h3>
              <div className="nav-group-items">
                {list.map((p) => (
                  <NavLink key={p.id} to={`/plugin/${p.id}`} className="nav-link">
                    {p.title}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}

        {COMBOS.some((c) => match(c.title, c.id)) && (
          <div className="nav-group">
            <h3 className="nav-group-title">
              <span className="sub">组合示例</span>
              <span className="count">
                {COMBOS.filter((c) => match(c.title, c.id)).length}
              </span>
            </h3>
            <div className="nav-group-items">
              {COMBOS.filter((c) => match(c.title, c.id)).map((c) => (
                <NavLink key={c.id} to={`/combo/${c.id}`} className="nav-link">
                  {c.title}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {ADVANCED.some((a) => match(a.title, a.id)) && (
          <div className="nav-group">
            <h3 className="nav-group-title">
              <span className="sub">高级功能</span>
              <span className="count">
                {ADVANCED.filter((a) => match(a.title, a.id)).length}
              </span>
            </h3>
            <div className="nav-group-items">
              {ADVANCED.filter((a) => match(a.title, a.id)).map((a) => (
                <NavLink
                  key={a.id}
                  to={`/advanced/${a.id}`}
                  className="nav-link"
                >
                  {a.title}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {q &&
          !GROUP_ORDER.some((cat) =>
            (PLUGINS_BY_CATEGORY[cat] || []).some((p) => match(p.title, p.id))
          ) &&
          !COMBOS.some((c) => match(c.title, c.id)) &&
          !ADVANCED.some((a) => match(a.title, a.id)) && (
            <p className="nav-empty">没有匹配「{query}」的条目</p>
          )}
      </nav>
    </aside>
  );
};
