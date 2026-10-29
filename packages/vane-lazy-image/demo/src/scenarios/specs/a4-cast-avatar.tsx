// 版式参照：影视剧详情页「演职人员」—— 圆形头像 + 主色氛围描边
// 装配：裁剪 → 兜底图 → 主色提取
import {
  LazyLoadImageCore,
  createColorExtractionPlugin,
  createCropPlugin,
  createFallbackImagePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 证件照比例的人像统一按脸部中心裁成方图，外面再用 CSS 裁圆
  createCropPlugin({ enabled: true, focusPoint: { x: 0.5, y: 0.4 }, showLabel: false }),
  // 演员库常有失效图，兜底一张人形占位比留白体面
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-cast-fallback/200/200",
  }),
  // 取头像主色铺在容器底上，圆形边缘不会露出突兀的白底
  createColorExtractionPlugin({ setContainerBg: true, sampleSize: 6, showOverlay: false }),
]);

const CAST = [
  { id: 1, name: "沈知远", role: "饰 陆沉" },
  { id: 2, name: "林慕白", role: "饰 苏晴" },
  { id: 3, name: "周维", role: "饰 老警察" },
  { id: 4, name: "许安然", role: "饰 小满" },
  { id: 5, name: "陈叙", role: "饰 董事长" },
  { id: 6, name: "何一舟", role: "饰 阿海" },
].map((it, i) => ({
  ...it,
  // 第 4 位故意给一个失效地址，用来演示兜底链路
  src:
    i === 3
      ? "https://invalid.vane-demo.test/cast-missing.jpg"
      : `https://picsum.photos/seed/vane-cast-${it.id}/200/200`,
}));

export default function CastAvatar() {
  return (
    <div style={STAGE}>
      {CAST.map((p) => (
        <div key={p.id} style={PERSON}>
          <div style={RING}>
            <Lazy
              src={p.src}
              alt={`${p.name} 饰演照`}
              loading="lazy"
              containerStyle={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <p style={NAME}>{p.name}</p>
          <p style={ROLE}>{p.role}</p>
        </div>
      ))}
    </div>
  );
}

const STAGE: CSSProperties = {
  background: "#111014",
  padding: 16,
  borderRadius: 6,
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 14,
};
const PERSON: CSSProperties = { textAlign: "center" };
const RING: CSSProperties = {
  width: 68,
  height: 68,
  margin: "0 auto 6px",
  borderRadius: "50%",
  padding: 2,
  background: "linear-gradient(135deg, rgba(255,122,41,.55), rgba(255,255,255,.06))",
  boxShadow: "0 6px 16px rgba(0,0,0,.45)",
};
const NAME: CSSProperties = { margin: 0, color: "#e9e4dc", fontSize: 12 };
const ROLE: CSSProperties = { margin: "2px 0 0", color: "#8b9080", fontSize: 10.5 };
