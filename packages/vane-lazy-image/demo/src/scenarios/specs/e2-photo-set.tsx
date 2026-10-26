// 版式参照：门户「图集 / 组图」浏览 —— 一图一页，左右翻，右下角是第几张
// 装配：画廊 → 进度蒙层 → 预连接
import {
  LazyLoadImageCore,
  createGalleryPlugin,
  createPreconnectPlugin,
  createProgressOverlayPlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  createGalleryPlugin({ enableLightbox: true, buttonText: "全屏看图", overlayZIndex: 18 }),
  // 组图翻页时给一条"这张加载到哪"的细进度条，比转圈更安定
  createProgressOverlayPlugin({ showWhen: "loading", height: 3, color: "#c0392b" }),
  createPreconnectPlugin({ domains: ["https://picsum.photos"], crossOrigin: "anonymous" }),
]);

const SET = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/vane-photoset-${i + 1}/900/600`,
  caption: `第 ${i + 1} 张 · 现场组图`,
}));

export default function PhotoSet() {
  const [page, setPage] = React.useState(0);
  const cur = SET[page];
  return (
    <div style={STAGE}>
      <div style={VIEWER}>
        <Lazy
          key={cur.id}
          src={cur.src}
          alt={cur.caption}
          loading="eager"
          containerStyle={{ width: "100%", height: "100%" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={BAR}>
        <button type="button" style={BTN} onClick={() => setPage((p) => Math.max(0, p - 1))}>
          上一张
        </button>
        <span style={COUNT}>
          {page + 1} / {SET.length} · {cur.caption}
        </span>
        <button
          type="button"
          style={BTN}
          onClick={() => setPage((p) => Math.min(SET.length - 1, p + 1))}
        >
          下一张
        </button>
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#1b1b1b", padding: 12, borderRadius: 6 };
const VIEWER: CSSProperties = { height: 190, borderRadius: 4, overflow: "hidden" };
const BAR: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginTop: 10,
};
const BTN: CSSProperties = {
  font: "inherit",
  fontSize: 11,
  padding: "5px 10px",
  color: "#f0f0f0",
  background: "rgba(255,255,255,.1)",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 3,
  cursor: "pointer",
};
const COUNT: CSSProperties = { color: "#b9b9b9", fontSize: 11 };
