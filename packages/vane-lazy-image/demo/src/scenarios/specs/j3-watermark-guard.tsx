// 版式参照：版权图库 / 设计素材站 —— 全站水印 + 防盗链，两者必须一起上
// 装配：水印 → 防盗链
import {
  LazyLoadImageCore,
  createAntiHotlinkPlugin,
  createWatermarkPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 平铺水印：单张图被截图也能看出出处
  createWatermarkPlugin({
    text: "© VANE STUDIO · 仅供预览",
    position: "bottom-right",
    opacity: 0.55,
    fontSize: 10,
    color: "#fff",
    offsetX: 10,
    offsetY: 8,
  }),
  // 只允许自家域引用；跨域直链时按策略处理
  createAntiHotlinkPlugin({ allowedDomains: ["picsum.photos"], checkReferer: false }),
]);

const WORKS = [
  { id: 1, title: "渐变矢量背景包", price: "¥39" },
  { id: 2, title: "手绘线条图标集", price: "¥59" },
  { id: 3, title: "金属质感纹理", price: "¥29" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-wm-${it.id}/320/240` }));

export default function WatermarkGuard() {
  return (
    <div style={STAGE}>
      <div style={ROW}>
        {WORKS.map((w) => (
          <figure key={w.id} style={CELL}>
            <Lazy
              src={w.src}
              alt={w.title}
              loading="lazy"
              containerStyle={{ width: "100%",
 aspectRatio: "320 / 240", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>
              {w.title}
              <span style={PRICE}>{w.price}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        水印是 DOM 叠层（不是烧进图片），下载原图时不会带上——所以真实业务还要配合服务端签名 URL。
        这里与防盗链插件一起装配，覆盖"可见保护 + 引用限制"两层。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0a0a0a", padding: 14, borderRadius: 6 };
const ROW: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 5, color: "#c9c9c9", fontSize: 10.5 };
const PRICE: CSSProperties = { display: "block", color: "#ffb27a", fontSize: 10.5, marginTop: 1 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#7a7a7a", fontSize: 10.5, lineHeight: 1.8 };
