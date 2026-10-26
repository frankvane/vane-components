// 版式参照：低端安卓 / 内存紧张场景 —— 视口外的图要主动中止解码
// 装配：内存压力中止 → 空闲解码
import {
  LazyLoadImageCore,
  createDecodeAfterIdlePlugin,
  createMemoryPressureAbortPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 设备内存 ≤4GB 或移动端时开启；离开视口立即 abort，释放解码位图
  createMemoryPressureAbortPlugin({
    enabled: true,
    deviceMemoryThreshold: 4,
    preferOnMobile: true,
    lowWidth: 640,
    abortOnLeave: true,
  }),
  // 解码排到空闲帧：滚动时不和合成线程抢主线程
  createDecodeAfterIdlePlugin({ enabled: true, timeoutMs: 600 }),
]);

const FEED = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  title: `动态 ${i + 1}`,
  src: `https://picsum.photos/seed/vane-mem-${i + 1}/480/320`,
}));

export default function MemoryPressure() {
  return (
    <div style={STAGE}>
      <div style={SCROLL}>
        {FEED.map((f) => (
          <figure key={f.id} style={FIG}>
            <Lazy
              src={f.src}
              alt={f.title}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{f.title}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        这个容器是可以滚的：往上滚时，刚离开视口的图会被 abort（Network 里状态变成 canceled），
        滚回来再重新发起——用更小的解码内存换更稳的滚动。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const SCROLL: CSSProperties = { maxHeight: 230, overflowY: "auto", paddingRight: 4 };
const FIG: CSSProperties = { margin: "0 0 10px" };
const CAP: CSSProperties = { display: "block", marginTop: 4, color: "#8c8c8c", fontSize: 10.5 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 10.5, lineHeight: 1.7 };
