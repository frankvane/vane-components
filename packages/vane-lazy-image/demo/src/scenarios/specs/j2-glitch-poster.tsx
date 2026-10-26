// 版式参照：电子音乐节 / 潮流活动海报 —— 故障风特效
// 装配：故障特效 → 滤镜
import {
  LazyLoadImageCore,
  createFilterPlugin,
  createGlitchEffectPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 悬停触发一次 RGB 分离 + 扫描线；continuous 会让它一直抖（很吃性能，慎用）
  createGlitchEffectPlugin({
    style: "glitch-mix",
    continuous: false,
    duration: 900,
    intensity: 0.7,
    rgbOffset: 3,
    scanLineCount: 24,
    triggerOnHover: true,
  }),
  // 底片先压一道对比度，故障感更强（contrast 的 amount 是倍率，≥1 才是加强）
  createFilterPlugin({ filter: "contrast", amount: 1.18 }),
]);

export default function GlitchPoster() {
  return (
    <div style={STAGE}>
      <div style={POSTER}>
        <Lazy
          src="https://picsum.photos/seed/vane-glitch/720/900"
          alt="电子音乐节海报"
          loading="lazy"
          containerStyle={{ width: "100%", height: "100%" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={OVERLAY}>
          {/* 底图偏亮时白字会糊在天空里，垫一层渐变遮罩保证文字始终读得出来 */}
          <div style={SCRIM} />
          <p style={LINE1}>NEON / 2024</p>
          <p style={LINE2}>电子音乐节 · 11.09</p>
        </div>
      </div>
      <p style={HINT}>悬停海报触发故障特效，离开即停——不要开 continuous，会一直占着合成层。</p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0a0a0a", padding: 14, borderRadius: 6 };
const POSTER: CSSProperties = { position: "relative", height: 220, borderRadius: 4, overflow: "hidden" };
const OVERLAY: CSSProperties = { position: "absolute", left: 14, bottom: 12, right: 14, zIndex: 3 };
const SCRIM: CSSProperties = {
  position: "absolute",
  inset: "-40px -14px -12px -14px",
  background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.72) 72%)",
  zIndex: -1,
};
const LINE1: CSSProperties = { margin: 0, color: "#ff2d55", fontSize: 10, letterSpacing: ".3em" };
const LINE2: CSSProperties = { margin: "4px 0 0", color: "#fff", fontSize: 16, fontWeight: 600 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#7a7a7a", fontSize: 10.5, lineHeight: 1.8 };
