// 版式参照：品牌落地页首屏 —— 背景图滚动视差 + 内容分块揭示
// 装配：视差 → 揭示动画 → 淡入
import {
  LazyLoadImageCore,
  createFadeInPlugin,
  createParallaxPlugin,
  createRevealAnimationPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 背景按 0.18 强度做 Y 轴视差，滚动时产生"慢一层"的纵深
  createParallaxPlugin({ strength: 0.18, axis: "y" }),
  // 分块揭示：fade-up 600ms，逐块延迟由 CSS 变量控制
  createRevealAnimationPlugin({ animation: "fade-up", duration: 600, easing: "ease-out" }),
  createFadeInPlugin({ durationMs: 400 }),
]);

const SECTIONS = [
  { id: 1, kicker: "01 / 材质", title: "一块铝，切 37 次", src: "https://picsum.photos/seed/vane-brand-1/900/560" },
  { id: 2, kicker: "02 / 结构", title: "把焊点藏进边角", src: "https://picsum.photos/seed/vane-brand-2/900/560" },
];

export default function BrandParallax() {
  return (
    <div style={STAGE}>
      {SECTIONS.map((s) => (
        <section key={s.id} style={SEC}>
          <div style={MEDIA}>
            <Lazy
              src={s.src}
              alt={s.title}
              loading="lazy"
              containerStyle={{ width: "100%", height: "100%" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div style={TEXT}>
            <p style={KICKER}>{s.kicker}</p>
            <h4 style={TITLE}>{s.title}</h4>
          </div>
        </section>
      ))}
      <p style={HINT}>
        视差是滚动驱动的：上下滚动这个页面，两张图的位移比文字慢。
        真实落地页把 strength 调到 0.3~0.5 更明显，这里的舞台高度做了收敛。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0b0b0b", padding: 14, borderRadius: 6 };
const SEC: CSSProperties = { position: "relative", height: 150, borderRadius: 6, overflow: "hidden", marginBottom: 12 };
const MEDIA: CSSProperties = { position: "absolute", inset: "-12% 0", height: "124%" };
const TEXT: CSSProperties = {
  position: "absolute",
  left: 14,
  bottom: 12,
  right: 14,
};
const KICKER: CSSProperties = { margin: 0, color: "#ffb27a", fontSize: 9.5, letterSpacing: ".14em" };
const TITLE: CSSProperties = { margin: "4px 0 0", color: "#fff", fontSize: 16 };
const HINT: CSSProperties = { margin: 0, color: "#7a7a7a", fontSize: 10.5, lineHeight: 1.8 };
