// 版式参照：爱奇艺 / olehdtv 播放页「选集」横滑条 —— 1 集 1 封面，横向滚动
// 装配：视口感知 → 并发闸控 → 内存缓存 → 骨架屏
import {
  LazyLoadImageCore,
  createConcurrencyControlPlugin,
  createMemoryCachePlugin,
  createSkeletonPlugin,
  createViewportAwarePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 横向滚动时只对进入视口的卡片开始加载
  createViewportAwarePlugin({ rootMargin: "120px", once: true }),
  // 选集一次滑过去会瞬间触发十几个请求，压到 4 并发
  createConcurrencyControlPlugin({ maxConcurrent: 4, scope: "global" }),
  createMemoryCachePlugin({ maxEntries: 120, ttlMs: 30 * 60 * 1000 }),
  createSkeletonPlugin({ type: "shimmer", borderRadius: 4 }),
]);

const EPISODES = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  no: i + 1,
  src: `https://picsum.photos/seed/vane-ep-${i + 1}/320/180`,
}));

export default function EpisodeRow() {
  return (
    <div style={STAGE}>
      <p style={TITLE}>选集 · 共 24 集</p>
      <div style={ROW}>
        {EPISODES.map((ep) => (
          <div key={ep.id} style={CELL}>
            <Lazy
              src={ep.src}
              alt={`第 ${ep.no} 集`}
              loading="lazy"
              containerStyle={{ width: "100%", aspectRatio: "320 / 180", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <span style={NO}>第 {ep.no} 集</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#111014", padding: 14, borderRadius: 6 };
const TITLE: CSSProperties = { margin: "0 0 10px", color: "#e9e4dc", fontSize: 13 };
const ROW: CSSProperties = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingBottom: 6,
  scrollSnapType: "x proximity",
};
const CELL: CSSProperties = {
  flex: "0 0 132px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  scrollSnapAlign: "start",
};
const NO: CSSProperties = { flexShrink: 0, color: "#8d857a", fontSize: 11 };
