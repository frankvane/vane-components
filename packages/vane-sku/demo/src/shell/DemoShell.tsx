/* eslint-disable react-refresh/only-export-components */
/**
 * 标准 demo 外壳（唯一真源：packages/templates/demo-shell/DemoShell.tsx）
 *
 * 由 scripts/sync-demo-shell.mjs 生成到各包 demo/src/shell/DemoShell.tsx，禁止手改。
 *
 * 所有组件 demo 共用同一套「壳」：侧栏（品牌块 + 编号导航 + 可折叠的逐项示例）/
 * 顶栏（面包屑 + guides 参考线开关 + source 外链）/ 抽屉与遮罩 / 页面级错误兜底。
 * 各包只提供一份 config（见 demo/src/demo.config.tsx），差异只允许出现在
 * 包名、副标题、品牌字、主题色（CSS 令牌）与页面内容上。
 */
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { HashRouter, Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

/** 结构上兼容各包 demos/types.ts 的 DemoEntry（不耦合具体类型） */
export interface ShellDemoEntry {
  meta: { slug: string; title: string; group: string };
  /** 文件名（waterfall 这类「一文件一页」的包有；按 catalog 组织的包没有） */
  file?: string;
}

export interface ShellNavItem {
  to: string;
  label: string;
  /** 导航右侧的等宽小字，如 "26 plugins" */
  hint?: string;
}

export interface ShellStat {
  /** 数值或短文本 */
  value: React.ReactNode;
  label: string;
  title?: string;
}

export interface DemoShellConfig<D extends ShellDemoEntry = ShellDemoEntry> {
  /** 包名，直接显示在品牌块 */
  pkg: string;
  /** 品牌方块里的字（单个字符） */
  brand: string;
  /** 品牌块副标题，如 "排版台 / plugin index" */
  subtitle: string;
  /** 应用级导航（编号页签），编号由外壳自动补 */
  nav: ShellNavItem[];
  /** 主内容路由（逐项示例路由由外壳自动挂：/demo 与 /demo/:slug） */
  routes: { path: string; element: React.ReactNode }[];
  /** 面包屑：路径 → 文案 */
  crumb: (pathname: string) => string;
  /** 逐项示例：分组（顺序即菜单顺序）+ 条目 + 单页渲染器 */
  demos: {
    label: string;
    groups: { key: string; label: string }[];
    entries: D[];
    detail: (entry: D, order: number) => React.ReactNode;
  };
  /** 侧栏页脚两行 */
  footer: [React.ReactNode, React.ReactNode];
  /** 顶栏右侧统计（可选） */
  stats?: ShellStat[];
  /** 源码仓库地址 */
  sourceUrl?: string;
}

const DEFAULT_SOURCE = "https://github.com/frankvane/vane-components";

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

/** 侧栏的「逐项示例」分组：默认展开当前所在组 */
/** 统一编号：取条目在 registry 里的位置（01…NN），不依赖各包的 file 命名 */
export function demoNo(demos: { entries: ShellDemoEntry[] }, entry: ShellDemoEntry): string {
  return String(demos.entries.indexOf(entry) + 1).padStart(2, "0");
}

function DemoNav<D extends ShellDemoEntry>({
  demos,
  pathname,
}: {
  demos: DemoShellConfig<D>["demos"];
  pathname: string;
}) {
  const { groups, entries, label } = demos;
  const activeGroup = entries.find((d) => pathname === `/demo/${d.meta.slug}`)?.meta.group;
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const first = groups[0]?.key;
    return Object.fromEntries(
      groups.map((g) => [g.key, g.key === (activeGroup ?? first)])
    ) as Record<string, boolean>;
  });

  // 跨组跳转（含直接改地址栏）时把当前组展开，否则导航看起来「跳丢了」
  useEffect(() => {
    if (!activeGroup) return;
    setOpen((prev) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
  }, [activeGroup]);

  return (
    <div className="nav-section">
      <div className="nav-section-head">
        <span>{label}</span>
        <code>{entries.length} demos</code>
      </div>
      {groups.map((g) => {
        const list = entries.filter((d) => d.meta.group === g.key);
        if (list.length === 0) return null;
        const expanded = open[g.key] ?? false;
        return (
          <div className="nav-group" key={g.key}>
            <button
              type="button"
              className={`nav-group-head${activeGroup === g.key ? " is-current" : ""}`}
              onClick={() => setOpen((prev) => ({ ...prev, [g.key]: !expanded }))}
              aria-expanded={expanded}
            >
              <span className={`nav-caret${expanded ? " is-open" : ""}`} aria-hidden>
                ▸
              </span>
              {g.label}
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
                    <em aria-hidden>{demoNo(demos, d)}</em>
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
function DemoRoute<D extends ShellDemoEntry>({ demos }: { demos: DemoShellConfig<D>["demos"] }) {
  const { slug } = useParams();
  const { entries, detail } = demos;
  const entry = slug ? entries.find((d) => d.meta.slug === slug) : undefined;
  if (!entry) return <Navigate to={`/demo/${entries[0].meta.slug}`} replace />;
  const order = entries.indexOf(entry) + 1;
  // key 必须带 slug：路由切换时同一个组件类型会被复用，
  // 详情页里的 useState(() => initialCfg(...)) 就只跑第一次 —— 现象是
  // 第二页开始控件值仍是上一页的（显示 undefined）。
  return <React.Fragment key={entry.meta.slug}>{detail(entry, order)}</React.Fragment>;
}

function Shell<D extends ShellDemoEntry>({ config }: { config: DemoShellConfig<D> }) {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [guides, setGuides] = useState(false);

  // 路由变化自动收起抽屉，否则点完导航还要手动关一次
  useEffect(() => setNavOpen(false), [pathname]);

  const toggleGuides = useCallback(() => setGuides((v) => !v), []);

  // Esc 关抽屉；g 切换参考线（输入框里按 g 不算）
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

  const demos = config.demos;
  const crumb = useMemo(() => {
    if (!pathname.startsWith("/demo")) return config.crumb(pathname);
    const slug = pathname.replace(/^\/demo\/?/, "");
    const hit = demos.entries.find((d) => d.meta.slug === slug);
    return hit ? `demo ${demoNo(demos, hit)} · ${hit.meta.title}` : "demo · 逐项示例";
  }, [pathname, config, demos]);

  const navItems = useMemo(
    () => config.nav.map((item, i) => ({ ...item, no: String(i + 1).padStart(2, "0") })),
    [config.nav]
  );

  return (
    <div className={`shell${navOpen ? " is-nav-open" : ""}${guides ? " is-guides" : ""}`}>
      {/* HashRouter 下 href="#main" 会被当成路由，必须自己接管焦点 */}
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
            {config.brand}
          </span>
          <span>
            <strong>{config.pkg}</strong>
            <em>{config.subtitle}</em>
          </span>
        </Link>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item${pathname === item.to ? " is-active" : ""}`}
              aria-current={pathname === item.to ? "page" : undefined}
            >
              <em aria-hidden>{item.no}</em>
              <span>{item.label}</span>
              {item.hint ? <code>{item.hint}</code> : null}
            </Link>
          ))}
          <DemoNav demos={config.demos} pathname={pathname} />
        </nav>
        <div className="side-foot">
          <p>{config.footer[0]}</p>
          <p className="muted">{config.footer[1]}</p>
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
          <span className="crumb">{crumb}</span>
          <div className="topbar-right">
            {config.stats?.map((s) => (
              <span className="topbar-stat" key={s.label} title={s.title}>
                <b>{s.value}</b> {s.label}
              </span>
            ))}
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
              href={config.sourceUrl ?? DEFAULT_SOURCE}
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
              {config.routes.map((r) => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
              <Route
                path="/demo"
                element={<Navigate to={`/demo/${config.demos.entries[0].meta.slug}`} replace />}
              />
              <Route path="/demo/:slug" element={<DemoRoute demos={config.demos} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageBoundary>
        </Suspense>
      </div>
    </div>
  );
}

export function DemoShell<D extends ShellDemoEntry>({ config }: { config: DemoShellConfig<D> }) {
  return (
    <HashRouter>
      <Shell config={config} />
    </HashRouter>
  );
}
