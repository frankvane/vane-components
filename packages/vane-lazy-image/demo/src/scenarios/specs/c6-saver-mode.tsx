// 版式参照：B 站移动端「省流模式」—— 3G / 低电量下只出缩略图
// 装配：省流量 → 电量感知 → 网络分析
import {
  LazyLoadImageCore,
  createBatteryAwarePlugin,
  createDataSaverPlugin,
  createNetworkAnalyticsPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 尊重 Save-Data 请求头：开启时按 0.6 质量降级，并关闭预取
  createDataSaverPlugin({ respectSaveData: true, fallbackQuality: 0.6, disablePreload: true }),
  // 电量低于 20% 时把请求宽度压到 640，同时停掉预连接
  createBatteryAwarePlugin({
    lowBatteryThreshold: 0.2,
    downgradeWidth: 640,
    disablePreconnect: true,
  }),
  // 采集每张图的实际传输字节与耗时，落到自己的上报端点
  createNetworkAnalyticsPlugin({ trackCDN: true }),
]);

const FEED = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  title: `动态封面 ${i + 1}`,
  src: `https://picsum.photos/seed/vane-saver-${i + 1}/320/180`,
}));

export default function SaverMode() {
  return (
    <div style={STAGE}>
      <div style={BAR}>
        <span style={CHIP}>Save-Data: on</span>
        <span style={CHIP}>电量 15%</span>
        <span style={CHIP}>3G</span>
      </div>
      <div style={GRID}>
        {FEED.map((f) => (
          <div key={f.id} style={CELL}>
            <Lazy
              src={f.src}
              alt={f.title}
              loading="lazy"
              containerStyle={{ width: "100%", aspectRatio: "320 / 180", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <span style={NAME}>{f.title}</span>
          </div>
        ))}
      </div>
      <p style={HINT}>
        上方三个状态是演示站的"环境模拟"口径；插件本身读的是真实的
        <code>navigator.connection</code> 与 <code>getBattery()</code>。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0f0f0f", padding: 14, borderRadius: 6 };
const BAR: CSSProperties = { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" };
const CHIP: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 10.5,
  color: "#ffb27a",
  border: "1px solid rgba(255,122,41,.4)",
  background: "rgba(255,122,41,.1)",
};
const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 10,
};
const CELL: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const NAME: CSSProperties = { flexShrink: 0, color: "#9a9a9a", fontSize: 10.5 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#7d7d7d", fontSize: 11, lineHeight: 1.7 };
