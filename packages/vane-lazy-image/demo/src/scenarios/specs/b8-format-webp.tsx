// 版式参照：电商列表页的「图片格式优化」—— 同图三份：AVIF/WebP/JPEG
// 装配：WebP 嗅探 → 格式改写（质量/宽度） → SVG 低清占位
import {
  LazyLoadImageCore,
  createImageOptimizationPlugin,
  createSvgPlaceholderPlugin,
  createWebPPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 运行时嗅探浏览器支持哪种格式（canvas.toDataURL），决定是否改写后缀
  createWebPPlugin({
    enabled: true,
    // rewrite 返回新地址；返回 undefined 表示不改（例如图床不支持 webp）
    rewrite: (src) => src.replace(/\.(jpe?g|png)$/i, ".webp"),
    replaceExtensions: ["jpg", "jpeg", "png"],
  }),
  // 图床侧再压一道：宽度上限 800、质量 0.82（真实项目把参数名对齐自己的图床）
  createImageOptimizationPlugin({
    enabled: true,
    maxWidth: 800,
    quality: 0.82,
    format: "auto",
    widthParam: "w",
    qualityParam: "q",
  }),
  // 图片没来之前先铺一层灰底 SVG，比纯色块更接近真实排版
  createSvgPlaceholderPlugin({
    svgContent:
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#e9ecef"/><text x="160" y="168" font-size="14" fill="#adb5bd" text-anchor="middle">loading…</text></svg>',
    fadeOutOnLoaded: true,
  }),
]);

const ITEMS = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/vane-format-${i + 1}/320/320.jpg`,
}));

export default function FormatWebp() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {ITEMS.map((it) => (
          <div key={it.id} style={CELL}>
            <Lazy
              src={it.src}
              alt={`商品图 ${it.id}`}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>
      <p style={HINT}>
        打开 DevTools 看这几张图的请求地址：Chromium 内核会被改写成带 <code>?w=800&amp;q=0.82</code>
        的版本；Safari 14 以前不支持 WebP 时保持原后缀。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 };
const CELL: CSSProperties = { borderRadius: 4, overflow: "hidden" };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 11, lineHeight: 1.7 };
