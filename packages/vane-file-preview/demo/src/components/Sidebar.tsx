import React from "react";
import { NavLink } from "react-router-dom";
import { GROUP_LABELS, GROUP_ORDER, PLUGINS_BY_GROUP } from "../data/plugin-catalog";
import { SAMPLE_COUNT } from "../data/samples";

/**
 * 侧栏：品牌 → 三个应用级入口 → 六个分组的插件列表。
 *
 * 分组顺序与 `custom-plugins/index.ts` 的导出分组一致，所以「文档里的表格顺序」
 * 「侧栏顺序」「工坊卡片顺序」是同一个顺序 —— 三个地方对不上时最难查。
 */
export const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const match = (title: string, id: string, en: string) =>
    !q ||
    title.toLowerCase().includes(q) ||
    id.toLowerCase().includes(q) ||
    en.toLowerCase().includes(q);

  const total = Object.values(PLUGINS_BY_GROUP).reduce((s, l) => s + l.length, 0);

  return (
    <aside className="sidebar" data-open={open} aria-label="插件导航">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          F
        </span>
        <span className="brand-text">
          <span className="brand-name">VANE FILE-PREVIEW</span>
          <span className="brand-meta">plugin index · {total} modules</span>
        </span>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="关闭导航菜单">
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
        <NavLink to="/demos" className="nav-app">
          逐项示例
        </NavLink>

        {GROUP_ORDER.map((group, gi) => {
          const all = PLUGINS_BY_GROUP[group];
          if (!all.length) return null;
          const list = all.filter((p) => match(p.title, p.id, p.en));
          if (!list.length) return null;
          return (
            <div className="nav-group" key={group}>
              <h3 className="nav-group-title">
                <span className="idx">{String(gi + 1).padStart(2, "0")}</span>
                <span className="sub">{GROUP_LABELS[group].label}</span>
                <span className="count">{list.length}</span>
              </h3>
              <div className="nav-group-items">
                {list.map((p) => (
                  <NavLink key={p.id} to={`/demos/${p.id}`} className="nav-link">
                    {p.title}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}

        {q &&
        !Object.values(PLUGINS_BY_GROUP).some((l) =>
          l.some((p) => match(p.title, p.id, p.en))
        ) ? (
          <p className="nav-empty">没有匹配「{query}」的插件</p>
        ) : null}

        <div className="nav-group">
          <h3 className="nav-group-title">
            <span className="sub">样本库</span>
            <span className="count">{SAMPLE_COUNT}</span>
          </h3>
          <div className="nav-group-items">
            <p className="nav-empty" style={{ margin: "2px 12px 0 20px" }}>
              demo/public/samples 里的真文件
            </p>
          </div>
        </div>
      </nav>
    </aside>
  );
};
