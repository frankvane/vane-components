// 版式参照：品牌产品页的「3D 卡片」—— 鼠标跟随倾斜 + 眩光，光标也变成放大态
// 装配：深度图（3D 倾斜）→ 动态光标
import {
  LazyLoadImageCore,
  createAnimatedCursorPlugin,
  createDepthMapPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 3D 倾斜：最大 18°，带眩光与阴影，离开自动回正
  createDepthMapPlugin({
    style: "tilt",
    intensity: 0.55,
    maxTilt: 18,
    enablePerspective: true,
    perspective: 900,
    enableGlare: true,
    enableShadow: true,
    resetOnLeave: true,
  }),
  // 光标跟随：小圆点跟随并在悬停时放大，暗示"这张图可以拖"
  createAnimatedCursorPlugin({
    style: "zoom-in",
    enableFollower: true,
    followerSize: 34,
    hoverScale: 1.4,
  }),
]);

const PRODUCTS = [
  { id: 1, name: "无线降噪耳机 Pro", note: "金属腔体 · 40h 续航" },
  { id: 2, name: "桌面音箱 Mini", note: "木质箱体 · 蓝牙 5.3" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-depth-${it.id}/520/520` }));

export default function DepthCard() {
  return (
    <div style={STAGE}>
      <div style={ROW}>
        {PRODUCTS.map((p) => (
          <figure key={p.id} style={CELL}>
            <Lazy
              src={p.src}
              alt={p.name}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 10, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>
              <b style={NAME}>{p.name}</b>
              <span style={NOTE}>{p.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>鼠标移到卡片上：整块按指针位置倾斜（最大 18°），并出现眩光与投影。</p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0a0a0a", padding: 18, borderRadius: 6 };
const ROW: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 8 };
const NAME: CSSProperties = { display: "block", color: "#eee", fontSize: 11.5 };
const NOTE: CSSProperties = { display: "block", color: "#8a8a8a", fontSize: 10, marginTop: 2 };
const HINT: CSSProperties = { margin: "12px 0 0", color: "#7a7a7a", fontSize: 10.5, lineHeight: 1.8 };
