import React, { Suspense, lazy } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";

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

const Loading: React.FC = () => <div className="loading">加载中…</div>;

const Shell: React.FC = () => (
  <div className="app">
    <Sidebar />
    <main className="main">
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </main>
  </div>
);

const App: React.FC = () => (
  <HashRouter>
    <Shell />
  </HashRouter>
);

export default App;
