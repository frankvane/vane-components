// 版式参照：电商图床防盗链 —— 直链返回 403，必须带签名或换域
// 装配：防盗链检测 → CDN 回退 → 兜底图
import {
  LazyLoadImageCore,
  createCDNFallbackPlugin,
  createFallbackImagePlugin,
  createAntiHotlinkPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 只信任自家域名；Referer 缺失或跨域时按策略处理（这里不强校验，便于演示）
  createAntiHotlinkPlugin({ allowedDomains: ["picsum.photos"], checkReferer: false }),
  // 主域挂了按顺序回退到备用 CDN
  createCDNFallbackPlugin({
    cdnBases: ["https://picsum.photos", "https://picsum.photos"],
  }),
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-hotlink-fallback/320/320",
  }),
]);

const ITEMS = [
  { id: 1, src: "https://picsum.photos/seed/vane-hotlink-1/320/320", label: "主图（主域名）" },
  { id: 2, src: "https://picsum.photos/seed/vane-hotlink-2/320/320", label: "主图（换 CDN 后）" },
  { id: 3, src: "https://invalid.vane-demo.test/blocked.jpg", label: "被拒 → 兜底图" },
];

export default function HotlinkGuard() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {ITEMS.map((it) => (
          <figure key={it.id} style={CELL}>
            <Lazy
              src={it.src}
              alt={it.label}
              loading="lazy"
              containerStyle={{ width: "100%",
 aspectRatio: "1", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{it.label}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        真实环境里主域会返回 403 并在响应头带 <code>Referer</code> 校验；
        这里的第三张走的是"完全不存在的域"，用来固定演示回退链路。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 5, color: "#9c9c9c", fontSize: 10 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 11, lineHeight: 1.7 };
