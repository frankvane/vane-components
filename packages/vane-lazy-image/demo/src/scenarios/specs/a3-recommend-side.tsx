// 版式参照：Netflix / 爱奇艺播放页右侧「相关推荐」—— 单列小图，滚动停稳才加载
// 装配：视口防抖 → IndexedDB 缓存 → 骨架屏
import {
  LazyLoadImageCore,
  createIDBCachePlugin,
  createSkeletonPlugin,
  createViewportDebouncePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 播放页正文在滚动，推荐位等滚动停 200ms 再发请求，避免和其他图抢带宽
  createViewportDebouncePlugin({ debounceMs: 200, onlyWhenIntersecting: true }),
  // 看完一集点下一集时，侧栏图已在 IDB 里，二次进入不发请求
  createIDBCachePlugin({ dbName: "vane-vod", ttlMs: 3 * 24 * 60 * 60 * 1000 }),
  createSkeletonPlugin({ type: "shimmer", borderRadius: 4 }),
]);

const RELATED = [
  { id: 1, title: "同导演作品 · 雾港", meta: "2023 · 悬疑" },
  { id: 2, title: "继续观看 · 第七个春天", meta: "上次看到 06 集" },
  { id: 3, title: "高分剧集 · 铁轨以南", meta: "9.1 分" },
  { id: 4, title: "为你推荐 · 海岸线", meta: "2024 · 剧情" },
  { id: 5, title: "同题材 · 深水区", meta: "2022 · 犯罪" },
  { id: 6, title: "片单 · 冷门佳片 20 部", meta: "编辑精选" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-rel-${it.id}/240/135` }));

export default function RecommendSide() {
  return (
    <div style={STAGE}>
      <p style={HEAD}>相关推荐</p>
      <ul style={LIST}>
        {RELATED.map((it) => (
          <li key={it.id} style={ITEM}>
            <div style={THUMB}>
              <Lazy
                src={it.src}
                alt={it.title}
                loading="lazy"
                containerStyle={{ width: "100%", height: "100%", borderRadius: 4, overflow: "hidden" }}
                imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={TEXT}>
              <p style={NAME}>{it.title}</p>
              <p style={META}>{it.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#141317", padding: 14, borderRadius: 6 };
const HEAD: CSSProperties = { margin: "0 0 10px", color: "#e9e4dc", fontSize: 13 };
const LIST: CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 };
const ITEM: CSSProperties = { display: "flex", gap: 10, alignItems: "center" };
const THUMB: CSSProperties = { flex: "0 0 112px", height: 63 };
const TEXT: CSSProperties = { minWidth: 0 };
const NAME: CSSProperties = {
  margin: 0,
  color: "#ddd6cc",
  fontSize: 12,
  lineHeight: 1.4,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const META: CSSProperties = { margin: "3px 0 0", color: "#807a70", fontSize: 11 };
