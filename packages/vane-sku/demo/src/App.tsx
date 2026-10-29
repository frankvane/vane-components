import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Sidebar, currentLabel } from "./components/Sidebar";
import { PLUGIN_COUNT } from "./data/plugin-catalog";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const PluginsPage = lazy(() =>
  import("./pages/PluginsPage").then((m) => ({ default: m.PluginsPage }))
);
const Workshop = lazy(() =>
  import("./pages/Workshop").then((m) => ({ default: m.Workshop }))
);
const Scenarios = lazy(() =>
  import("./pages/Scenarios").then((m) => ({ default: m.Scenarios }))
);

const Loading: React.FC = () => <div className="loading">loading modules…</div>;

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn"
        onClick={onMenu}
        aria-label="打开导航菜单"
      >
        <span aria-hidden="true" />
      </button>
      <span className="topbar-title">{currentLabel(pathname)}</span>
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <span className="topbar-stat" title="官方插件总数">
          <b>{PLUGIN_COUNT}</b> plugins
        </span>
        <span className="topbar-stat" title="演示运行时">
          <i className="pulse" aria-hidden="true" />
          live
        </span>
      </div>
    </header>
  );
}

const Shell: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

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
              <Route path="/plugins" element={<PluginsPage />} />
              <Route path="/workshop" element={<Workshop />} />
              <Route path="/scenarios" element={<Scenarios />} />
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

const App: React.FC = () => (
  <HashRouter>
    <Shell />
  </HashRouter>
);

export default App;
