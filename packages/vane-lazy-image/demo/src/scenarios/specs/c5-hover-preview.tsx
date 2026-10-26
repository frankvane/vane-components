// 版式参照：B 站 / YouTube 封面悬停起播预览 —— 悬停先预取后续帧，再淡入替换
// 装配：悬停预取 → Fetch 加载（可控流） → 过渡
import {
  LazyLoadImageCore,
  createFetchLoaderPlugin,
  createHoverPrefetchPlugin,
  createTransitionPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 悬停 300ms 后预取同一视频的后续帧（真实项目里换成视频首帧/雪碧图分片）
  createHoverPrefetchPlugin({
    trigger: "mouseenter",
    as: "image",
    max: 2,
    dedupe: true,
    getNextSrc: (ctx) => ctx.src.replace(/f(\d+)/, (_m, n) => `f${Number(n) + 1}`),
  }),
  // 用 fetch 拉成 blob 再挂载：可以拿到进度、可中断、可复用缓存
  createFetchLoaderPlugin({ enabled: true, timeout: 20000 }),
  createTransitionPlugin({
    durationMs: 260,
    fromOpacity: 0,
    toOpacity: 1,
    fromScale: 1.02,
    toScale: 1,
  }),
]);

const FRAMES = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  label: `预览序列 ${i + 1}`,
  src: `https://picsum.photos/seed/vane-hover-f${i}/360/203`,
}));

export default function HoverPreview() {
  return (
    <div style={STAGE}>
      <p style={HINT}>把鼠标移到任意一帧上：会预取下一帧，松开后已就绪</p>
      <div style={ROW}>
        {FRAMES.map((f) => (
          <div key={f.id} style={TILE}>
            <Lazy
              src={f.src}
              alt={f.label}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 6, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <span style={LABEL}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0f0f0f", padding: 14, borderRadius: 6 };
const HINT: CSSProperties = { margin: "0 0 10px", color: "#9a9a9a", fontSize: 11.5 };
const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
  gap: 10,
};
const TILE: CSSProperties = { position: "relative" };
const LABEL: CSSProperties = {
  position: "absolute",
  left: 6,
  bottom: 6,
  padding: "2px 6px",
  borderRadius: 2,
  fontSize: 10,
  color: "#0f0f0f",
  background: "rgba(255,255,255,.82)",
};
