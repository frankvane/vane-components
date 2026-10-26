// 版式参照：微博 / 小红书笔记详情 —— 九宫格相册，点开进灯箱左右切换
// 装配：画廊灯箱 → 过渡 → 骨架屏
import {
  LazyLoadImageCore,
  createGalleryPlugin,
  createSkeletonPlugin,
  createTransitionPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 九宫格里单张图也可能被点开看大图
  createGalleryPlugin({
    enableLightbox: true,
    buttonText: "查看大图",
    overlayZIndex: 20,
    // 九宫格里每张都挂按钮，默认尺寸会糊满整格：缩成右下角的小胶囊，只做入口不抢画面
    buttonStyle: {
      top: "auto",
      bottom: 6,
      right: 6,
      padding: "3px 7px",
      fontSize: 10,
      borderRadius: 999,
      background: "rgba(0,0,0,.55)",
    },
  }),
  createTransitionPlugin({ durationMs: 240, fromOpacity: 0, toOpacity: 1, fromScale: 1.02, toScale: 1 }),
  createSkeletonPlugin({ type: "pulse", backgroundColor: "#eef0f2", highlightColor: "#f7f8f9", borderRadius: 4 }),
]);

const PHOTOS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/vane-nine-${i + 1}/360/360`,
}));

export default function NineGridLightbox() {
  return (
    <div style={STAGE}>
      <p style={HEAD}>共 9 张 · 点任意一张查看大图</p>
      <div style={GRID}>
        {PHOTOS.map((p) => (
          <div key={p.id} style={CELL}>
            <Lazy
              src={p.src}
              alt={`相册第 ${p.id} 张`}
              loading="lazy"
              containerStyle={{ width: "100%", aspectRatio: "1", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 12, borderRadius: 6 };
const HEAD: CSSProperties = { margin: "0 0 8px", color: "#9c9c9c", fontSize: 11 };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 };
const CELL: CSSProperties = { borderRadius: 4, overflow: "hidden" };
