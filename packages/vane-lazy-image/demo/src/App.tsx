import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { PLUGINS_BY_CATEGORY } from "./data/plugin-catalog";
import { DEMOS, findDemo } from "./demos/registry";
import { DemoPage } from "./demos/DemoPage";

const Home = lazy(() =>
  import("./pages/Home").then((m) => ({ default: m.Home }))
);
const PluginDetail = lazy(() =>
  import("./pages/PluginDetail").then((m) => ({ default: m.PluginDetail }))
);
const CombosPage = lazy(() =>
  import("./pages/CombosPage").then((m) => ({ default: m.CombosPage }))
);
const AdvancedPage = lazy(() =>
  import("./pages/AdvancedPage").then((m) => ({ default: m.AdvancedPage }))
);
const ScenariosPage = lazy(() =>
  import("./pages/ScenariosPage").then((m) => ({ default: m.ScenariosPage }))
);
const WorkshopPage = lazy(() =>
  import("./pages/WorkshopPage").then((m) => ({ default: m.WorkshopPage }))
);
const GalleryPage = lazy(() =>
  import("./pages/GalleryPage").then((m) => ({ default: m.GalleryPage }))
);

const Loading: React.FC = () => <div className="loading">loading modules…</div>;

// 顶栏只承担「我在哪」和「系统在跑」两件事：路径 → 等宽小标签
function currentLabel(pathname: string): string {
  if (pathname === "/") return "index / 索引";
  if (pathname.startsWith("/plugin/")) return "plugin / 插件详情";
  if (pathname.startsWith("/combo")) return "combo / 组合示例";
  if (pathname.startsWith("/advanced")) return "advanced / 高级功能";
  if (pathname.startsWith("/scenarios")) return "scenario / 场景示例";
  if (pathname.startsWith("/workshop")) return "workshop / 插件工坊";
  if (pathname.startsWith("/gallery")) return "gallery / 商品图集";
  if (pathname.startsWith("/demo")) return "demo / 逐项示例";
  return "index / 索引";
}

// /demo/:slug —— 找不到就回第一个示例，不要停在空白页
function DemoRoute() {
  const { slug } = useParams();
  const entry = slug ? findDemo(slug) : undefined;
  if (!entry) return <Navigate to={`/demo/${DEMOS[0].meta.slug}`} replace />;
  const order = DEMOS.indexOf(entry) + 1;
  // key 带 slug：路由切换时同一个组件类型会被复用，key 变化强制重挂载，避免状态串台
  return <DemoPage key={entry.meta.slug} entry={entry} order={order} />;
}

const TopBar: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const { pathname } = useLocation();
  const total = Object.values(PLUGINS_BY_CATEGORY).reduce(
    (s, l) => s + l.length,
    0
  );
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
        <span className="topbar-stat" title="已注册插件总数">
          <b>{total}</b> plugins
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

  // 路由切换后自动收起抽屉，避免移动端停留在遮罩上
  useEffect(() => setNavOpen(false), [pathname]);

  // Esc 关闭抽屉
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
              <Route path="/" element={<Home />} />
              <Route path="/plugin/:id" element={<PluginDetail />} />
              <Route path="/combos" element={<CombosPage />} />
              <Route path="/combo/:id" element={<CombosPage />} />
              <Route path="/advanced" element={<AdvancedPage />} />
              <Route path="/advanced/:id" element={<AdvancedPage />} />
              <Route path="/scenarios" element={<ScenariosPage />} />
              <Route path="/workshop" element={<WorkshopPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/demo" element={<Navigate to={`/demo/${DEMOS[0].meta.slug}`} replace />} />
              <Route path="/demo/:slug" element={<DemoRoute />} />
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
