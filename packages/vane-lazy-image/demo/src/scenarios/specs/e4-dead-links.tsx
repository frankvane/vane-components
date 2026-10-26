// 版式参照：老牌资讯站 —— 外链图常年 404，且没人上报你就永远不知道
// 装配：CDN 回退 → 兜底图 → 错误追踪
import {
  LazyLoadImageCore,
  createCDNFallbackPlugin,
  createErrorTrackingPlugin,
  createFallbackImagePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 主域 → 备用域按顺序试，命中即止
  createCDNFallbackPlugin({ cdnBases: ["https://picsum.photos"] }),
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-dead-fallback/300/200",
  }),
  // 失败要能被"看见"：这里把上报打到内存队列，真实项目换成自己的埋点端点
  createErrorTrackingPlugin({
    report: (payload: unknown) => {
      const q = ((window as unknown as { __vaneDeadLink?: unknown[] }).__vaneDeadLink ??= []);
      q.push(payload);
    },
    showBadge: true,
    badgeText: "404",
  }),
]);

const LINKS = [
  { id: 1, src: "https://picsum.photos/seed/vane-dead-1/300/200", label: "正常外链" },
  { id: 2, src: "https://invalid.vane-demo.test/2019/old-article.jpg", label: "已失效（2019 年的图）" },
  { id: 3, src: "https://invalid.vane-demo.test/2020/moved.jpg", label: "已失效（图床迁移）" },
];

export default function DeadLinks() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {LINKS.map((l) => (
          <figure key={l.id} style={CELL}>
            <Lazy
              src={l.src}
              alt={l.label}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 3, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{l.label}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        打开控制台执行 <code>window.__vaneDeadLink</code> 可以看到失败上报的原始记录。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 5, color: "#9c9c9c", fontSize: 10 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 11 };
