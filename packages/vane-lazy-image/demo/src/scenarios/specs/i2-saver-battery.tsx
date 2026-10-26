// 版式参照：移动端省流量 / 低电量降级 —— 电量 15% 时不该再拉高清图
// 装配：省流量 → 电量感知 → 自适应质量
import {
  LazyLoadImageCore,
  createAdaptiveQualityPlugin,
  createBatteryAwarePlugin,
  createDataSaverPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 系统打开"省流量"时整体降质并关闭预取
  createDataSaverPlugin({ respectSaveData: true, fallbackQuality: 0.6, disablePreload: true }),
  // 电量低于 20%：请求宽度压到 640，并停掉预连接
  createBatteryAwarePlugin({ lowBatteryThreshold: 0.2, downgradeWidth: 640, disablePreconnect: true }),
  // 兜底：按网络类型（slow-2g/3g/4g）决定质量档位
  createAdaptiveQualityPlugin({ lowQ: 40, highQ: 80, saveDataQuality: 30 }),
]);

const CARDS = [
  { id: 1, name: "折叠屏手机", price: "¥6,999" },
  { id: 2, name: "降噪耳机", price: "¥1,299" },
  { id: 3, name: "便携投影", price: "¥2,499" },
  { id: 4, name: "机械键盘", price: "¥399" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-batt-${it.id}/320/320` }));

export default function SaverBattery() {
  return (
    <div style={STAGE}>
      <div style={PHONE}>
        <div style={TOPBAR}>
          <span style={CHIP}>省流量 开</span>
          <span style={CHIP}>电量 15%</span>
          <span style={CHIP}>4G</span>
        </div>
        <div style={GRID}>
          {CARDS.map((c) => (
            <figure key={c.id} style={CELL}>
              <Lazy
                src={c.src}
                alt={c.name}
                loading="lazy"
                containerStyle={{ width: "100%",
 aspectRatio: "1", borderRadius: 4, overflow: "hidden" }}
                imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <figcaption style={CAP}>
                {c.name}
                <span style={PRICE}>{c.price}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#f4f5f7", padding: 14, borderRadius: 6 };
const PHONE: CSSProperties = { maxWidth: 280, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 10 };
const TOPBAR: CSSProperties = { display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" };
const CHIP: CSSProperties = {
  fontSize: 9.5,
  padding: "1px 7px",
  borderRadius: 999,
  color: "#0b7a5a",
  background: "rgba(11,122,90,.08)",
  border: "1px solid rgba(11,122,90,.28)",
};
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 4, color: "#333", fontSize: 10 };
const PRICE: CSSProperties = { display: "block", color: "#e1251b", fontSize: 11 };
