// 版式参照：Pexels 图片详情 —— 灯箱看图 + 下载按钮 + 主色板
// 装配：画廊 → 下载按钮 → 颜色样本
import {
  LazyLoadImageCore,
  createColorSwatchPlugin,
  createDownloadButtonPlugin,
  createGalleryPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  createGalleryPlugin({ enableLightbox: true, buttonText: "全屏", overlayZIndex: 20 }),
  // 下载按钮要带正确的文件名与扩展名，否则用户下到的是无后缀文件
  createDownloadButtonPlugin({
    filename: "vane-photo.jpg",
    position: "top-right",
    showOnHover: true,
    tooltipText: "下载原图",
  }),
  // 底部生成可点选的主色板，点击即复制色值
  createColorSwatchPlugin({
    maxColors: 5,
    position: "bottom",
    swatchSize: 22,
    showColorCode: true,
    interactive: true,
  }),
]);

export default function LightboxDownload() {
  return (
    <div style={STAGE}>
      <div style={CARD}>
        <Lazy
          src="https://picsum.photos/seed/vane-download/900/600"
          alt="海岸线黄昏"
          loading="lazy"
          containerStyle={{ width: "100%", borderRadius: 6, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <p style={HINT}>悬停：右上出现下载按钮；底部是取出的 5 个主色（点一下复制色值）。</p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0a0a0a", padding: 16, borderRadius: 6 };
const CARD: CSSProperties = { position: "relative", maxWidth: 420, margin: "0 auto" };
const HINT: CSSProperties = { margin: "12px 0 0", color: "#8a8a8a", fontSize: 11, textAlign: "center" };
