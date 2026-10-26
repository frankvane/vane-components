// 版式参照：购物车页「猜你喜欢」横滑 —— 滑到即加载，但下一张要提前备好
// 装配：视口感知 → 预测加载 → 悬停预取
import {
  LazyLoadImageCore,
  createHoverPrefetchPlugin,
  createPredictiveLoadingPlugin,
  createViewportAwarePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 横向滚动容器里，只有真正进入视口的卡片才发请求
  createViewportAwarePlugin({ rootMargin: "200px", once: true }),
  // 按滚动方向预测接下来会看到哪几张，提前 2 张预热
  createPredictiveLoadingPlugin({ model: "heuristic", strategy: "increment", maxPreload: 2 }),
  // 指针悬停在卡片上时，再补一次"下一张"预取（触屏设备走 touchstart）
  createHoverPrefetchPlugin({ trigger: "mouseenter", max: 1, dedupe: true }),
]);

const RECS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `猜你喜欢 ${i + 1}`,
  price: 39 + i * 20,
  src: `https://picsum.photos/seed/vane-recs-${i + 1}/240/240`,
}));

export default function CartRecs() {
  return (
    <div style={STAGE}>
      <p style={HEAD}>猜你喜欢 · 为你推荐</p>
      <div style={ROW}>
        {RECS.map((r) => (
          <div key={r.id} style={CARD}>
            <Lazy
              src={r.src}
              alt={r.name}
              loading="lazy"
              containerStyle={{ width: "100%", aspectRatio: "1", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <p style={NAME}>{r.name}</p>
            <p style={PRICE}>¥{r.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const HEAD: CSSProperties = { margin: "0 0 10px", color: "#1a1a1a", fontSize: 13 };
const ROW: CSSProperties = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingBottom: 8,
  scrollSnapType: "x proximity",
};
const CARD: CSSProperties = { flex: "0 0 108px", scrollSnapAlign: "start" };
const NAME: CSSProperties = {
  margin: "6px 0 0",
  color: "#333",
  fontSize: 11,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const PRICE: CSSProperties = { margin: "2px 0 0", color: "#e1251b", fontSize: 12 };
