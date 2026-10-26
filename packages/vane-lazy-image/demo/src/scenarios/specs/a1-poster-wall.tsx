// 版式参照：olehdtv 影视列表页 —— 竖版海报墙（2:3，一行 5 张，首屏 2 行）
// 装配：首屏优先 → 宽高比占位 → 模糊渐显 → 淡入
import {
  LazyLoadImageCore,
  createAspectRatioSpacerPlugin,
  createBlurUpPlugin,
  createFadeInPlugin,
  createPriorityLoadingPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 首屏海报是 LCP 主体，压过下游几十张图的请求
  createPriorityLoadingPlugin({ priority: "high" }),
  // 2:3 竖版占位，加载前后不跳动
  createAspectRatioSpacerPlugin({ ratio: 2 / 3 }),
  createBlurUpPlugin({ startBlur: 14, endBlur: 0, durationMs: 520 }),
  createFadeInPlugin({ durationMs: 320, easing: "ease-out" }),
]);

const POSTERS = [
  { id: 1, title: "长夜将明", meta: "更新至 24 集" },
  { id: 2, title: "雾港", meta: "全 12 集" },
  { id: 3, title: "第七个春天", meta: "更新至 08 集" },
  { id: 4, title: "铁轨以南", meta: "全 36 集" },
  { id: 5, title: "海岸线", meta: "更新至 16 集" },
  { id: 6, title: "深水区", meta: "全 10 集" },
  { id: 7, title: "回声", meta: "更新至 05 集" },
  { id: 8, title: "南风档案", meta: "全 28 集" },
  { id: 9, title: "雪线", meta: "更新至 20 集" },
  { id: 10, title: "旧城记", meta: "全 18 集" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-vod-${it.id}/300/450` }));

export default function PosterWall() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {POSTERS.map((it) => (
          <figure key={it.id} style={CARD}>
            <Lazy
              src={it.src}
              alt={`${it.title} 海报`}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAPTION}>{it.title}</figcaption>
            <span style={META}>{it.meta}</span>
          </figure>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#111014", padding: 16, borderRadius: 6 };
const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
  gap: 12,
};
const CARD: CSSProperties = { margin: 0, display: "flex", flexDirection: "column", gap: 4 };
const CAPTION: CSSProperties = {
  flexShrink: 0,
  color: "#e9e4dc",
  fontSize: 12,
  lineHeight: 1.35,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const META: CSSProperties = { flexShrink: 0, color: "#8d857a", fontSize: 11 };
