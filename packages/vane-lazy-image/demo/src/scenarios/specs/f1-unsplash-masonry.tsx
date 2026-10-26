// 版式参照：Unsplash 探索页 —— 瀑布流无限滚动，回访要命中本地缓存
// 装配：IndexedDB 缓存 → 并发闸控 → 视口感知 → 骨架屏
import {
  LazyLoadImageCore,
  createConcurrencyControlPlugin,
  createIDBCachePlugin,
  createSkeletonPlugin,
  createViewportAwarePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 图库用户会反复回看同一批图：落 IndexedDB，二次进入不走网络
  createIDBCachePlugin({ dbName: "vane-gallery", ttlMs: 7 * 24 * 60 * 60 * 1000 }),
  createConcurrencyControlPlugin({ maxConcurrent: 6, scope: "global", adaptive: true }),
  createViewportAwarePlugin({ rootMargin: "240px", once: true }),
  createSkeletonPlugin({ type: "shimmer", backgroundColor: "#1c1c1c", highlightColor: "#262626", borderRadius: 4 }),
]);

const PHOTOS = [
  { id: 1, ratio: 3 / 4, by: "A. Rivera" },
  { id: 2, ratio: 1, by: "M. Chen" },
  { id: 3, ratio: 4 / 5, by: "K. Novak" },
  { id: 4, ratio: 2 / 3, by: "L. Silva" },
  { id: 5, ratio: 1, by: "S. Hara" },
  { id: 6, ratio: 3 / 4, by: "D. Okafor" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-uns-${it.id}/360/${Math.round(360 / it.ratio)}` }));

export default function UnsplashMasonry() {
  return (
    <div style={STAGE}>
      <div style={MASONRY}>
        {PHOTOS.map((p) => (
          <figure key={p.id} style={CELL}>
            <Lazy
              src={p.src}
              alt={`photo by ${p.by}`}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{p.by}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>刷新页面第二次打开：这些图会直接从 IndexedDB 出，Network 面板不再发请求。</p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0a0a0a", padding: 12, borderRadius: 6 };
const MASONRY: CSSProperties = { columnCount: 3, columnGap: 8 };
const CELL: CSSProperties = { margin: "0 0 8px", breakInside: "avoid" };
const CAP: CSSProperties = { marginTop: 4, color: "#8a8a8a", fontSize: 9.5 };
const HINT: CSSProperties = { margin: "4px 0 0", color: "#7a7a7a", fontSize: 10.5, lineHeight: 1.7 };
