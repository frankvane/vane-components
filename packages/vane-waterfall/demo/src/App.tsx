import React, { Suspense, lazy, useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useParams, Link } from "react-router-dom";
import { DEMOS, DEMO_GROUPS, demosOf, findDemo } from "./demos/registry";
import { GROUP_META } from "./demos/types";
import { DemoPage } from "./demos/DemoPage";

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
  if (pathname.startsWith("/demo")) {
    const slug = pathname.replace(/^\/demo\/?/, "");
    const hit = findDemo(slug);
    return hit ? `demo / ${hit.meta.title}` : "demo / 逐项示例";
  }
  return "index / 总览";
}

/** 侧栏的「逐项示例」分组：默认展开当前所在组 */
function DemoNav({ pathname }: { pathname: string }) {
  const activeGroup = DEMOS.find((d) => pathname === `/demo/${d.meta.slug}`)?.meta.group;
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DEMO_GROUPS.map((g) => [g, g === (activeGroup ?? "basic")])) as Record<
      string,
      boolean
    >
  );

  // 跨组跳转（含直接改地址栏）时把当前组展开，否则导航看起来「跳丢了」
  useEffect(() => {
    if (!activeGroup) return;
    setOpen((prev) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
  }, [activeGroup]);

  return (
    <div className="nav-section">
      <div className="nav-section-head">
        <span>逐项示例</span>
        <code>{DEMOS.length} demos</code>
      </div>
      {DEMO_GROUPS.map((g) => {
        const list = demosOf(g);
        const expanded = open[g] ?? false;
        return (
          <div className="nav-group" key={g}>
            <button
              type="button"
              className={`nav-group-head${activeGroup === g ? " is-current" : ""}`}
              onClick={() => setOpen((prev) => ({ ...prev, [g]: !expanded }))}
            >
              <span className={`nav-caret${expanded ? " is-open" : ""}`} aria-hidden>
                ▸
              </span>
              {GROUP_META[g].label}
              <code>{list.length}</code>
            </button>
            {expanded ? (
              <div className="nav-list">
                {list.map((d) => (
                  <Link
                    key={d.meta.slug}
                    to={`/demo/${d.meta.slug}`}
                    className={`nav-sub${pathname === `/demo/${d.meta.slug}` ? " is-active" : ""}`}
                  >
                    <em>{d.file.slice(0, 2)}</em>
                    {d.meta.title}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** /demo/:slug —— 找不到就回第一个示例，不要停在空白页 */
function DemoRoute() {
  const { slug } = useParams();
  const entry = slug ? findDemo(slug) : undefined;
  if (!entry) return <Navigate to={`/demo/${DEMOS[0].meta.slug}`} replace />;
  const order = DEMOS.indexOf(entry) + 1;
  // key 必须带 slug：路由切换时同一个组件类型会被复用，
  // DemoPage 里 useState(() => initialCfg(meta)) 就只跑第一次 —— 现象是
  // 第二页开始控件值仍是上一页的（显示 undefined）。
  return <DemoPage key={entry.meta.slug} entry={entry} order={order} />;
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
          <DemoNav pathname={pathname} />
        </nav>
        <div className="side-foot">
          <p>26 个领域插件 · 13 个组合场景 · 34 页逐项示例</p>
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
              <Route path="/demo" element={<Navigate to={`/demo/${DEMOS[0].meta.slug}`} replace />} />
              <Route path="/demo/:slug" element={<DemoRoute />} />
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
