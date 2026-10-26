// 版式参照：移动端 3G 弱网 —— 骨架 + 真实进度条 + 请求耗时采集
// 装配：网络分析 → 骨架屏 → 进度蒙层
import {
  LazyLoadImageCore,
  createNetworkAnalyticsPlugin,
  createProgressOverlayPlugin,
  createSkeletonPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 采集 transferSize / duration / responseStatus，落到自己的日志端点
  createNetworkAnalyticsPlugin({ trackCDN: true }),
  createSkeletonPlugin({ type: "shimmer", backgroundColor: "#eef0f2", highlightColor: "#f7f9fa", borderRadius: 4 }),
  // 慢网下百分比比转圈更能留住人
  createProgressOverlayPlugin({ showWhen: "loading", height: 3, color: "#1f6feb", showPercentText: true }),
]);

const FEED = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  title: `图文动态 ${i + 1}`,
  src: `https://picsum.photos/seed/vane-3g-${i + 1}/480/320`,
}));

export default function Slow3G() {
  return (
    <div style={STAGE}>
      <div style={PHONE}>
        <div style={BAR}>
          <span style={SIGNAL}>3G · 650ms RTT</span>
          <span style={SIGNAL}>↓ 0.4 Mbps</span>
        </div>
        {FEED.map((f) => (
          <figure key={f.id} style={FIG}>
            <Lazy
              src={f.src}
              alt={f.title}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 6, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{f.title}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        想在真机上复现：Chrome DevTools → Network → Slow 3G 后刷新。
        这里的状态条是"环境模拟"提示，插件读的是真实网络。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#f4f5f7", padding: 14, borderRadius: 6 };
const PHONE: CSSProperties = {
  maxWidth: 260,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 12,
  padding: 10,
  border: "1px solid #e6e8eb",
};
const BAR: CSSProperties = { display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" };
const SIGNAL: CSSProperties = {
  fontSize: 9.5,
  color: "#1f6feb",
  border: "1px solid rgba(31,111,235,.3)",
  borderRadius: 999,
  padding: "1px 7px",
  background: "rgba(31,111,235,.06)",
};
const FIG: CSSProperties = { margin: "0 0 8px" };
const CAP: CSSProperties = { display: "block", marginTop: 4, color: "#6b6b6b", fontSize: 10 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#8c8c8c", fontSize: 10.5, lineHeight: 1.7 };
