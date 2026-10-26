import React from "react";
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { getPluginFactory } from "../data/plugin-catalog";
import { DemoLayout } from "../components/DemoLayout";
import { CodeBlock } from "../components/CodeBlock";

// 内联场景：电商商品网格（缓存 + 骨架 + 淡入 + 兜底图）
const EcommerceGrid: React.FC = () => {
  const cache = getPluginFactory("cache-memory");
  const skeleton = getPluginFactory("skeleton");
  const fade = getPluginFactory("fade-in");
  const fallback = getPluginFactory("fallback-image");
  if (!cache || !skeleton || !fade || !fallback) {
    return <div className="preview-error">缺少场景所需插件</div>;
  }
  const LazyImage = withPlugins(LazyLoadImageCore as any, [
    cache({ max: 200 }),
    skeleton({ type: "shimmer" }),
    fade({ duration: 0.6 }),
    fallback({ fallbackSrc: "https://picsum.photos/seed/fallback/200/200" }),
  ]);
  const items = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12,
      }}
    >
      {items.map((i) => (
        <div key={i} style={{ width: "100%", aspectRatio: "1 / 1" }}>
          <LazyImage
            src={`https://picsum.photos/seed/prod${i}/200/200`}
            alt={`商品 ${i}`}
            loading="lazy"
            containerStyle={{ width: "100%", height: "100%" }}
            imageStyle={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        </div>
      ))}
    </div>
  );
};

const LazyVertical = React.lazy(
  () => import("../scenarios/VirtualVerticalListDemo.tsx")
);
const LazyHorizontal = React.lazy(
  () => import("../scenarios/VirtualHorizontalListDemo.tsx")
);
const LazyGrid = React.lazy(() => import("../scenarios/VirtualGridDemo.tsx"));

export const ScenariosPage: React.FC = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">场景示例</h1>
        <p className="page-desc">
          把多个插件组合进真实业务场景：电商商品网格、长列表虚拟滚动等。
        </p>
      </div>

      <DemoLayout
        title="电商商品网格"
        description="内存缓存 + 骨架屏 + 淡入 + 兜底图，应对高并发商品图加载。"
      >
        <EcommerceGrid />
        <CodeBlock
          code={`const LazyImage = withPlugins(LazyLoadImageCore, [
  createCacheMemoryPlugin({ max: 200 }),
  createSkeletonPlugin({ type: "shimmer" }),
  createFadeInPlugin({ duration: 0.6 }),
  createFallbackImagePlugin({ fallbackSrc: "/fallback.jpg" }),
]);`}
        />
      </DemoLayout>

      <h2 className="section-title">长列表虚拟滚动</h2>
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
