// 版式参照：京东商品详情页 —— 主图 + 缩略图联动 + 悬停放大 + SKU 色卡
// 装配：画廊（主图切换）→ 悬停放大 → 颜色样本 → 预连接
import {
  LazyLoadImageCore,
  createColorSwatchPlugin,
  createGalleryPlugin,
  createHoverZoomPlugin,
  createPreconnectPlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  createGalleryPlugin({ enableLightbox: true, buttonText: "查看大图", overlayZIndex: 12 }),
  // 商详页的放大镜：只做 1.08 倍轻放大，避免拖影
  createHoverZoomPlugin({ scale: 1.08, durationMs: 180 }),
  // 选色即换主图，色卡本身就是 SKU 入口
  createColorSwatchPlugin({ maxColors: 5, position: "bottom", swatchSize: 26, showPalette: true }),
  createPreconnectPlugin({ domains: ["https://picsum.photos"], crossOrigin: "anonymous" }),
]);

const SHOTS = [1, 2, 3, 4].map((i) => `https://picsum.photos/seed/vane-sku-${i}/600/600`);

export default function SkuGalleryZoom() {
  const [active, setActive] = React.useState(0);
  return (
    <div style={STAGE}>
      <div style={MAIN}>
        <Lazy
          src={SHOTS[active]}
          alt="商品主图"
          loading="eager"
          containerStyle={{ width: "100%", borderRadius: 6, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={THUMBS}>
        {SHOTS.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            style={{ ...THUMB, borderColor: i === active ? "#e1251b" : "#e5e5e5" }}
            aria-label={`查看第 ${i + 1} 张`}
          >
            <Lazy
              src={src}
              alt=""
              loading="lazy"
              containerStyle={{ width: "100%", height: "100%" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>
      <p style={HINT}>
        缩略图悬停走 1.08x 放大；点「查看大图」进灯箱；换主图时缩略图已在缓存里，无二次请求。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const MAIN: CSSProperties = { maxWidth: 300, margin: "0 auto" };
const THUMBS: CSSProperties = { display: "flex", gap: 8, justifyContent: "center", marginTop: 10 };
const THUMB: CSSProperties = {
  width: 56,
  height: 56,
  padding: 0,
  borderRadius: 4,
  border: "1px solid #e5e5e5",
  overflow: "hidden",
  background: "none",
  cursor: "pointer",
};
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 11, lineHeight: 1.7 };
