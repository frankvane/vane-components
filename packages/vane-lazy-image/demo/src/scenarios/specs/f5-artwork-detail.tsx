// 版式参照：数字艺术品详情页 —— 主色铺底、入场形变、进入即预热下一张
// 装配：主色 → 自定义效果 → 形变 → 缓存预热
import {
  LazyLoadImageCore,
  createCachePrewarmPlugin,
  createCustomEffectsPlugin,
  createDominantColorPlugin,
  createMorphPlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 用作品主色铺容器底：图片还没到时也不会突兀地刷白
  createDominantColorPlugin({ color: "rgba(0,0,0,.06)" }),
  // 悬停时轻微上浮 + 提亮，作品墙用这种"手能摸到"的反馈最合适
  createCustomEffectsPlugin({
    hoverImageStyle: { transform: "translateY(-4px) scale(1.02)", filter: "brightness(1.06)" },
    containerStyle: { transition: "transform .3s ease" },
  }),
  // 从圆角方图变形成方形大图（进入详情时的过渡）
  createMorphPlugin({
    type: "elastic",
    duration: 900,
    fromBorderRadius: "12px",
    toBorderRadius: "2px",
    fromScale: 0.94,
    toScale: 1,
  }),
  // 进入详情页即预热同系列的下两张
  createCachePrewarmPlugin({ trigger: "enter", preferMemory: true, showBadge: true }),
]);

const ART = [
  { id: 1, title: "No.014 · 潮汐", src: "https://picsum.photos/seed/vane-art-1/600/720" },
  { id: 2, title: "No.015 · 潮汐", src: "https://picsum.photos/seed/vane-art-2/600/720" },
];

export default function ArtworkDetail() {
  const [idx, setIdx] = React.useState(0);
  const cur = ART[idx];
  return (
    <div style={STAGE}>
      <div style={CARD}>
        <Lazy
          key={cur.id}
          src={cur.src}
          alt={cur.title}
          loading="eager"
          containerStyle={{ width: "100%",
 aspectRatio: "600 / 720", borderRadius: 6, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={BAR}>
        <span style={NAME}>{cur.title}</span>
        <button
          type="button"
          style={BTN}
          onClick={() => setIdx((i) => (i + 1) % ART.length)}
        >
          看下一件
        </button>
      </div>
      <p style={HINT}>切到第二件时 Network 里应已命中预热缓存（准备早于点击）。</p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0f0f0f", padding: 14, borderRadius: 6 };
const CARD: CSSProperties = { maxWidth: 300, margin: "0 auto" };
const BAR: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  maxWidth: 300,
  margin: "10px auto 0",
};
const NAME: CSSProperties = { color: "#e6e6e6", fontSize: 12 };
const BTN: CSSProperties = {
  font: "inherit",
  fontSize: 11,
  padding: "4px 10px",
  color: "#ffb27a",
  background: "transparent",
  border: "1px solid rgba(255,122,41,.45)",
  borderRadius: 3,
  cursor: "pointer",
};
const HINT: CSSProperties = { margin: "10px auto 0", maxWidth: 300, color: "#7a7a7a", fontSize: 10.5, lineHeight: 1.7 };
