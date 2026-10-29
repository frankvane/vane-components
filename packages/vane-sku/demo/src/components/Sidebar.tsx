import React from "react";
import { NavLink } from "react-router-dom";
import { PLUGIN_GROUPS, PLUGIN_COUNT } from "../data/plugin-catalog";

/**
 * 侧边栏：与 vane-lazy-image 演示站同一套结构（品牌铭牌 + 应用入口 + 分组插件链接）。
 */
export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside className="sidebar" data-open={open}>
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          S
        </span>
        <span className="brand-text">
          <span className="brand-name">vane-sku</span>
          <span className="brand-meta">spec selector · 0.1.0</span>
        </span>
      </div>

      <nav className="nav" aria-label="演示站导航">
        <NavLink to="/" className={({ isActive }) => `nav-app${isActive ? " active" : ""}`} end>
          快速上手
        </NavLink>
        <NavLink to="/workshop" className={({ isActive }) => `nav-app${isActive ? " active" : ""}`}>
          插件工坊
        </NavLink>
        <NavLink to="/scenarios" className={({ isActive }) => `nav-app${isActive ? " active" : ""}`}>
          场景集
        </NavLink>

        {PLUGIN_GROUPS.map((g, gi) => (
          <div className={`nav-group${gi === 0 ? " is-hot" : ""}`} key={g.group}>
            <div className="nav-group-title">
              <span className="idx">{String(gi + 1).padStart(2, "0")}</span>
              <span>{g.group}</span>
              <span className="sub">{g.items.length}</span>
            </div>
            <div className="nav-group-items">
              {g.items.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/plugins#${p.id}`}
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                >
                  {p.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="nav-empty">共 {PLUGIN_COUNT} 个官方插件</div>
      </nav>
    </aside>
  );
}

/** 顶栏：只承担「我在哪」和「系统在跑」两件事 */
export function currentLabel(pathname: string): string {
  if (pathname === "/") return "index / 快速上手";
  if (pathname.startsWith("/plugins")) return "plugin / 插件清单";
  if (pathname.startsWith("/workshop")) return "workshop / 插件工坊";
  if (pathname.startsWith("/scenarios")) return "scenario / 场景集";
  return "index / 快速上手";
}
