// 版式参照：小红书首页「发现」—— 三列不等高瀑布流，图高参差
// 装配：宽高比占位 → 视口感知 → 模糊渐显 → 并发闸控
import {
  LazyLoadImageCore,
  createAspectRatioSpacerPlugin,
  createBlurUpPlugin,
  createConcurrencyControlPlugin,
  createViewportAwarePlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

// 每条笔记比例不同：占位插件按条目比例装配，避免滑动时整列跳动
function Note({ item }: { item: (typeof NOTES)[number] }) {
  const Lazy = React.useMemo(
    () =>
      withPlugins(LazyLoadImageCore as any, [
        createAspectRatioSpacerPlugin({ ratio: item.ratio }),
        createViewportAwarePlugin({ rootMargin: "150px", once: true }),
        createBlurUpPlugin({ startBlur: 10, durationMs: 420 }),
        createConcurrencyControlPlugin({ maxConcurrent: 5, scope: "global" }),
      ]),
    [item.ratio],
  );

  return (
    <figure style={CELL}>
      <Lazy
        src={item.src}
        alt={item.title}
        loading="lazy"
        containerStyle={{ width: "100%", borderRadius: 8, overflow: "hidden" }}
        imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <figcaption style={CAP}>{item.title}</figcaption>
      <p style={META}>{item.author}</p>
    </figure>
  );
}

const NOTES = [
  { id: 1, title: "周末去了趟海边，风很大但很值", author: "一颗柠檬", ratio: 3 / 4 },
  { id: 2, title: "租房改造第 3 期：只花了 200 块", author: "小满", ratio: 1 },
  { id: 3, title: "这份早餐我连吃一周没腻", author: "厨房日记", ratio: 4 / 5 },
  { id: 4, title: "城市徒步路线 · 沿江 8 公里", author: "走路的人", ratio: 2 / 3 },
  { id: 5, title: "把手账搬到桌面上了", author: "纸上生活", ratio: 1 },
  { id: 6, title: "冬天第一杯热可可", author: "甜度超标", ratio: 3 / 4 },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-xhs-${it.id}/360/${Math.round(360 / it.ratio)}` }));

export default function XhsMasonry() {
  return (
    <div style={STAGE}>
      <div style={MASONRY}>
        {NOTES.map((n) => (
          <Note key={n.id} item={n} />
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 12, borderRadius: 6 };
const MASONRY: CSSProperties = { columnCount: 3, columnGap: 8 };
const CELL: CSSProperties = { margin: "0 0 8px", breakInside: "avoid" };
const CAP: CSSProperties = {
  marginTop: 5,
  color: "#1a1a1a",
  fontSize: 10.5,
  lineHeight: 1.4,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const META: CSSProperties = { margin: "2px 0 0", color: "#9c9c9c", fontSize: 9.5 };
