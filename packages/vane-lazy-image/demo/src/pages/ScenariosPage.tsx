import React from "react";

import { CATEGORIES, SCENARIOS, scenariosOf } from "../scenarios/catalog";
import { ScenarioCard } from "../components/ScenarioCard";
import type { CatId } from "../scenarios/types";

const LazyVertical = React.lazy(() => import("../scenarios/VirtualVerticalListDemo.tsx"));
const LazyHorizontal = React.lazy(() => import("../scenarios/VirtualHorizontalListDemo.tsx"));
const LazyGrid = React.lazy(() => import("../scenarios/VirtualGridDemo.tsx"));

export const ScenariosPage: React.FC = () => {
  const [cat, setCat] = React.useState<CatId>("vod");
  const list = React.useMemo(() => scenariosOf(cat), [cat]);
  const current = CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">场景示例</h1>
        <p className="page-desc">
          {CATEGORIES.length} 类业务 · {SCENARIOS.length} 个场景，全部按真实站点的版式复刻
          （京东搜索结果、B 站推荐流、VOD 海报墙…），图片一律用占位源替换。每个场景给两份源码：
          完整版含假数据与样式，整段可粘贴；最小装配版只保留插件装配那十几行。
        </p>
      </div>

      <nav className="scn-tabs" role="tablist" aria-label="场景分类">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            className="scn-tab"
            aria-selected={cat === c.id}
            onClick={() => setCat(c.id)}
          >
            {c.label}
            <b>{scenariosOf(c.id).length}</b>
          </button>
        ))}
      </nav>

      <p className="scn-blurb">
        <strong style={{ color: "var(--text-2)" }}>{current.en}</strong> — {current.blurb}
      </p>

      <div className="scn-list">
        {list.length ? (
          list.map((m) => <ScenarioCard key={m.id} meta={m} />)
        ) : (
          <div className="scn-empty">该类场景正在补齐。</div>
        )}
      </div>

      <h2 className="section-title" style={{ marginTop: 40 }}>
        附：长列表虚拟滚动
      </h2>
      <p className="scn-blurb">
        与上方「场景」不同，这三例是组合示例：把虚拟滚动容器和懒加载内核拼在一起，
        验证网格双向滚动下的请求节流。
      </p>
      <React.Suspense fallback={<div className="loading">加载中…</div>}>
        <LazyVertical />
      </React.Suspense>
      <React.Suspense fallback={<div className="loading">加载中…</div>}>
        <LazyHorizontal />
      </React.Suspense>
      <React.Suspense fallback={<div className="loading">加载中…</div>}>
        <LazyGrid />
      </React.Suspense>
    </div>
  );
};
