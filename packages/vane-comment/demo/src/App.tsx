import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
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
  { to: "/", no: "01", label: "总览", hint: "overview" },
  { to: "/plugins", no: "02", label: "插件工坊", hint: "4 plugins" },
  { to: "/scenarios", no: "03", label: "场景示例", hint: "4 plates" },
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
      <div className="crash" role="alert">
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
  if (pathname.startsWith("/plugins")) return "workshop · 插件工坊";
  if (pathname.startsWith("/scenarios")) return "plates · 场景示例";
  if (pathname.startsWith("/demo")) {
    const slug = pathname.replace(/^\/demo\/?/, "");
    const hit = findDemo(slug);
    return hit ? `demo ${hit.file.slice(0, 2)} · ${hit.meta.title}` : "demo · 逐项示例";
  }
  return "index · 总览";
}

/** 侧栏的「逐项示例」分组：默认展开当前所在组 */
function DemoNav({ pathname }: { pathname: string }) {
  const activeGroup = DEMOS.find((d) => pathname === `/demo/${d.meta.slug}`)?.meta.group;
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DEMO_GROUPS.map((g) => [g, g === (activeGroup ?? "plugin")])) as Record<
      string,
      boolean
    >
  );

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
              aria-expanded={expanded}
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
                    <em aria-hidden>{d.file.slice(0, 2)}</em>
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
  const [navOpen, setNavOpen] = useState(false);
  const [guides, setGuides] = useState(false);

  useEffect(() => setNavOpen(false), [pathname]);

  const toggleGuides = useCallback(() => setGuides((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "Escape") setNavOpen(false);
      if (!typing && (e.key === "g" || e.key === "G") && !e.metaKey && !e.ctrlKey) {
        setGuides((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={`shell${navOpen ? " is-nav-open" : ""}${guides ? " is-guides" : ""}`}
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("main");
          el?.setAttribute("tabindex", "-1");
          el?.focus();
          el?.scrollIntoView({ block: "start" });
        }}
      >
        跳到内容
      </a>

      <aside className="side" aria-label="站点导航">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden>
            v
          </span>
          <span>
            <strong>vane-comment</strong>
            <em>评论区 / plugin index</em>
          </span>
        </Link>
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item${pathname === item.to ? " is-active" : ""}`}
              aria-current={pathname === item.to ? "page" : undefined}
            >
              <em aria-hidden>{item.no}</em>
              <span>{item.label}</span>
              <code>{item.hint}</code>
            </Link>
          ))}
          <DemoNav pathname={pathname} />
        </nav>
        <div className="side-foot">
          <p>4 PLUGINS · 4 PLATES</p>
          <p className="muted">{DEMOS.length} DEMOS · COMMENT CORE</p>
        </div>
      </aside>

      <button
        type="button"
        className="scrim"
        aria-label="关闭导航"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />

      <div className="main" id="main">
        <header className="topbar">
          <button
            type="button"
            className="nav-toggle"
            aria-label={navOpen ? "关闭导航" : "打开导航"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <span aria-hidden />
          </button>
          <span className="crumb">{labelOf(pathname)}</span>
          <div className="topbar-right">
            <button
              type="button"
              className="topbar-btn"
              aria-pressed={guides}
              onClick={toggleGuides}
              title="显示栏位参考线（快捷键 G）"
            >
              <i aria-hidden />
              guides
            </button>
            <a
              className="topbar-link"
              href="https://github.com/frankvane/vane-components"
              target="_blank"
              rel="noreferrer"
            >
              source ↗
            </a>
          </div>
        </header>

        <div className="guides" aria-hidden />
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
      </div>
    </div>
  );
}

// 默认导出：comment 的 main.tsx 是 `import App from "./App"`
function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}

export default App;
