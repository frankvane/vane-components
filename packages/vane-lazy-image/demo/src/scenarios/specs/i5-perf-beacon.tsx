// 版式参照：内容站的"图片性能看板"—— 每张图都能读出耗时、命中率、曝光时长
// 装配：性能监控 → 事件日志 → 用户行为 → 视口驻留
import {
  LazyLoadImageCore,
  createEventLoggerPlugin,
  createPerformanceMonitorPlugin,
  createUserBehaviorPlugin,
  createViewportDwellPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 右上角浮层实时显示耗时/解码/命中情况
  createPerformanceMonitorPlugin({ showOverlay: true, overlayPosition: "top-right" }),
  // 事件日志：把 load-start / load-success / load-error 打到控制台
  createEventLoggerPlugin({ enabled: true, prefix: "[VANE]" }),
  // 用户行为：曝光、点击、停留，统一成一个上报回调
  createUserBehaviorPlugin({
    enabled: true,
    // 真实站点只要数据，不要角标面板压在商品图上
    showOverlay: false,
    onReport: (payload: unknown) => {
      const q = ((window as unknown as { __vaneBehavior?: unknown[] }).__vaneBehavior ??= []);
      q.push(payload);
    },
  }),
  // 曝光去抖：停留 250ms 才算"看见"，避免快速划过的假曝光
  // onlyWhenIntersecting 关掉：这一屏是首屏常驻图，不需要「离开就中止」的门控
  createViewportDwellPlugin({ dwellMs: 250, onlyWhenIntersecting: false, maxWaitMs: 1200 }),
]);

const ITEMS = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/vane-perf-${i + 1}/320/200`,
}));

export default function PerfBeacon() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {ITEMS.map((it) => (
          <div key={it.id} style={CELL}>
            <Lazy
              src={it.src}
              alt={`埋点图 ${it.id}`}
              loading="lazy"
              containerStyle={{ width: "100%", aspectRatio: "320 / 200", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>
      <p style={HINT}>
        每张图右上角是实时耗时浮层；控制台按 <code>[VANE]</code> 前缀输出事件；
        <code>window.__vaneBehavior</code> 里是曝光与点击上报。这是"可观测"最省事的接法。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0f0f0f", padding: 14, borderRadius: 6 };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const CELL: CSSProperties = { borderRadius: 4, overflow: "hidden" };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#8a8a8a", fontSize: 10.5, lineHeight: 1.75 };
