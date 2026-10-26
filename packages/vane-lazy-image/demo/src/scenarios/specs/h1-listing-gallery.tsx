// 版式参照：贝壳 / 爱彼迎房源图集 —— 1 张主图 + 4 张缩略，横滑切换
// 装配：宽高比占位 → 画廊 → 悬停预取
import {
  LazyLoadImageCore,
  createAspectRatioSpacerPlugin,
  createGalleryPlugin,
  createHoverPrefetchPlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 房源图统一 4:3，横滑时高度不跳
  createAspectRatioSpacerPlugin({ ratio: 4 / 3 }),
  createGalleryPlugin({ enableLightbox: true, buttonText: "看图集", overlayZIndex: 20 }),
  // 悬停缩略图时预取"下一张"，点开即见
  createHoverPrefetchPlugin({
    trigger: "mouseenter",
    as: "image",
    max: 1,
    getNextSrc: (ctx) => ctx.src.replace(/h(\d+)/, (_m, n) => `h${Number(n) + 1}`),
  }),
]);

const SHOTS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/vane-house-h${i + 1}/640/480`,
  alt: `房源图 ${i + 1}`,
}));

export default function ListingGallery() {
  const [active, setActive] = React.useState(0);
  return (
    <div style={STAGE}>
      <div style={MAIN}>
        <Lazy
          key={SHOTS[active].id}
          src={SHOTS[active].src}
          alt={SHOTS[active].alt}
          loading="eager"
          containerStyle={{ width: "100%", borderRadius: 6, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={STRIP}>
        {SHOTS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            style={{ ...THUMB, outline: i === active ? "2px solid #ff7a29" : "none" }}
            aria-label={s.alt}
          >
            <Lazy
              src={s.src}
              alt=""
              loading="lazy"
              containerStyle={{ width: "100%", height: "100%" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0f0f0f", padding: 12, borderRadius: 6 };
const MAIN: CSSProperties = { maxWidth: 380, margin: "0 auto" };
const STRIP: CSSProperties = { display: "flex", gap: 6, justifyContent: "center", marginTop: 8 };
const THUMB: CSSProperties = {
  width: 54,
  height: 40,
  padding: 0,
  border: 0,
  borderRadius: 3,
  overflow: "hidden",
  cursor: "pointer",
  background: "none",
};
