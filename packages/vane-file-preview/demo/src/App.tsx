import React, { Suspense, lazy, useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { PLUGIN_COUNT } from "./data/plugin-catalog";
import { SAMPLE_COUNT } from "./data/samples";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const DemosPage = lazy(() => import("./pages/DemosPage").then((m) => ({ default: m.DemosPage })));
const DemoDetailPage = lazy(() =>
  import("./pages/DemoDetailPage").then((m) => ({ default: m.DemoDetailPage }))
);
const WorkshopPage = lazy(() =>
  import("./pages/WorkshopPage").then((m) => ({ default: m.WorkshopPage }))
);
const ScenariosPage = lazy(() =>
  import("./pages/ScenariosPage").then((m) => ({ default: m.ScenariosPage }))
);

const Loading: React.FC = () => <div className="loading">loading modules…</div>;

/** 顶栏只承担「我在哪」+「系统在跑」两件事 */
function currentLabel(pathname: string): string {
  if (pathname === "/") return "index / 索引";
  if (pathname.startsWith("/demos/")) return "demo / 逐项示例";
  if (pathname === "/demos") return "demos / 示例目录";
  if (pathname.startsWith("/workshop")) return "workshop / 插件工坊";
  if (pathname.startsWith("/scenarios")) return "scenario / 场景示例";
  return "index / 索引";
}

const TopBar: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const { pathname } = useLocation();
  return (
    <header className="topbar">
      <button type="button" className="icon-btn" onClick={onMenu} aria-label="打开导航菜单">
        <span aria-hidden="true" />
      </button>
      <span className="topbar-title">{currentLabel(pathname)}</span>
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <span className="topbar-stat" title="已注册插件总数">
          <b>{PLUGIN_COUNT}</b> plugins
        </span>
        <span className="topbar-stat" title="样本库里的真文件">
          <b>{SAMPLE_COUNT}</b> samples
        </span>
        <span className="topbar-stat" title="演示运行时">
          <i className="pulse" aria-hidden="true" />
          live
        </span>
      </div>
    </header>
  );
};

const Shell: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  // 路由切换后收起抽屉，避免移动端停在遮罩上
  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        跳到主内容
      </a>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-body">
        <TopBar onMenu={() => setNavOpen(true)} />
        <main className="main" id="main">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/demos" element={<DemosPage />} />
              <Route path="/demos/:id" element={<DemoDetailPage />} />
              <Route path="/workshop" element={<WorkshopPage />} />
              <Route path="/scenarios" element={<ScenariosPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <div
        className="nav-scrim"
        data-open={navOpen}
        aria-hidden="true"
        onClick={() => setNavOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => (
  <HashRouter>
    <Shell />
  </HashRouter>
);
