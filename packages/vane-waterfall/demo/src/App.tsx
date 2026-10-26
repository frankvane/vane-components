import React, { Suspense, lazy } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, Link } from "react-router-dom";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PluginsPage = lazy(() =>
  import("./pages/PluginsPage").then((m) => ({ default: m.PluginsPage }))
);
const ScenariosPage = lazy(() =>
  import("./pages/ScenariosPage").then((m) => ({ default: m.ScenariosPage }))
);

const NAV = [
  { to: "/", label: "总览", hint: "overview" },
  { to: "/plugins", label: "插件工坊", hint: "26 plugins" },
  { to: "/scenarios", label: "场景示例", hint: "13 layouts" },
];

/**
 * 页面级错误兜底。
 * 没有它，任何一个 lazy 页面在渲染期抛错都会让整棵树被 React 卸掉 ——
 * 现象是「整页空白、侧栏也消失」，排查时毫无线索。这里把错误摊在页面上。
 */
class PageBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <h3>这个页面炸了</h3>
        <pre>{String(this.state.error?.stack || this.state.error)}</pre>
        <button type="button" onClick={() => this.setState({ error: null })}>
          重试
        </button>
      </div>
    );
  }
}

function labelOf(pathname: string): string {
  if (pathname.startsWith("/plugins")) return "workshop / 插件工坊";
  if (pathname.startsWith("/scenarios")) return "scenario / 场景示例";
  return "index / 总览";
}

function Shell() {
  const { pathname } = useLocation();
  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>vane-waterfall</strong>
            <em>瀑布流 · 插件化</em>
          </span>
        </Link>
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item${pathname === item.to ? " is-active" : ""}`}
            >
              <span>{item.label}</span>
              <code>{item.hint}</code>
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <p>26 个领域插件 · Core 12KB gzip</p>
          <p className="muted">D1-A 布局钩子 / D2-A 虚拟化</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span className="crumb">{labelOf(pathname)}</span>
          <a className="topbar-link" href="https://github.com/frankvane/vane-components" target="_blank" rel="noreferrer">
            source ↗
          </a>
        </header>
        <Suspense fallback={<div className="loading">loading modules…</div>}>
          <PageBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/plugins" element={<PluginsPage />} />
              <Route path="/scenarios" element={<ScenariosPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageBoundary>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
