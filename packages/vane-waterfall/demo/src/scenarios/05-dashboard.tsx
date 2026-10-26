/**
 * 05 · 指标卡看板（对标自建 BI 首页）
 *
 * 版式诉求：卡片不等高、置顶「核心指标」、列高尽量齐平、刷新后回到原位。
 * balanced 分配 + PinItem + StatePersistence 是这类看板的标配。
 */
import React, { useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createAlignmentPlugin,
  createGapPlugin,
  createPinItemPlugin,
  createResponsiveColumnsPlugin,
  createStatePersistencePlugin,
} from "vane-waterfall/custom-plugins";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "dashboard",
  title: "指标卡看板",
  group: "后台",
  ref: { label: "自建 BI 首页", url: "https://ant.design/components/card-cn" },
  pain: "卡片高度参差、核心指标要固定位置，刷新后还要回到原来的滚动位置",
  plugs: [
    { fn: "createAlignmentPlugin", cfg: 'mode: "balanced"', why: "看板在意「每列卡片数接近」，而不是「每列高度接近」" },
    { fn: "createPinItemPlugin", cfg: "pinnedIndices: [0, 1], column: 0", why: "两块核心指标钉在最左列，且按顺序纵向堆叠" },
    { fn: "createResponsiveColumnsPlugin", cfg: "breakpoints: { sm: { width: 0, columns: 1 }, md: { width: 640, columns: 2 }, lg: { width: 1024, columns: 3 } }", why: "窄屏退到单列，卡片不被压扁" },
    { fn: "createGapPlugin", cfg: "columnGap: 12, rowGap: 12", why: "看板要紧凑" },
    { fn: "createStatePersistencePlugin", cfg: 'storageKey: "demo-dashboard", persistScroll: true', why: "记住滚动位置，刷新回到原处" },
  ],
  props: ["containerStyle={{ height: 420 }}", "renderItem={(item, i) => <Metric item={item} pinned={i < 2} />}"],
  note: "balanced 与 shortest 在列高相同时都取最左列，所以两种模式的差异只在「项数」与「高度」哪个先触发换列。",
};

interface Metric {
  id: string;
  title: string;
  value: string;
  delta: number;
  height: number;
  series: number[];
  tone: "up" | "down";
}

// 高度要容得下「标题 / 数值 / 环比 / 迷你走势」四行，否则走势图会被裁掉
const RAW: Array<[string, string, number, number]> = [
  ["今日 GMV", "¥ 1,284,900", 12.4, 124],
  ["支付订单", "18,432", 6.1, 124],
  ["客单价", "¥ 69.7", -2.3, 104],
  ["新增用户", "3,204", 21.8, 128],
  ["次日留存", "41.2%", 0.8, 128],
  ["退款率", "1.9%", -0.4, 104],
  ["客服响应", "38s", -12.0, 118],
  ["库存周转", "6.4 天", 3.2, 118],
  ["履约及时率", "97.6%", 1.1, 124],
  ["投诉工单", "24", -18.5, 104],
  ["毛利率", "38.4%", 2.2, 112],
  ["复购率", "23.9%", 4.6, 112],
];

const DATA: Metric[] = RAW.map(([title, value, delta, height], i) => ({
  id: `m${i}`,
  title,
  value,
  delta,
  height,
  tone: delta >= 0 ? "up" : "down",
  series: Array.from({ length: 12 }, (_v, k) => 30 + Math.abs(Math.sin((i + 1) * (k + 2) * 1.7)) * 70),
}));

const Waterfall = withPlugins<Metric>(WaterfallCore, [
  createAlignmentPlugin({ mode: "balanced" }),
  createPinItemPlugin({ pinnedIndices: [0, 1], column: 0 }),
  createResponsiveColumnsPlugin({
    breakpoints: {
      sm: { width: 0, columns: 1 },
      md: { width: 640, columns: 2 },
      lg: { width: 1024, columns: 3 },
    },
  }),
  createGapPlugin({ columnGap: 12, rowGap: 12 }),
  createStatePersistencePlugin({ storageKey: "demo-dashboard", persistScroll: true }),
]);

function Sparkline({ points, tone }: { points: number[]; tone: "up" | "down" }) {
  const w = 132;
  const h = 22;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (p / 100) * h).toFixed(1)}`)
    .join(" ");
  const stroke = tone === "up" ? "#e2534b" : "#2f9e6e";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="wf-spark">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({ item, pinned }: { item: Metric; pinned?: boolean }) {
  return (
    <div className={`wf-card is-metric${pinned ? " is-pinned" : ""}`} style={{ height: item.height }}>
      <div className="wf-metric-head">
        <span className="wf-metric-title">{item.title}</span>
        {pinned ? <span className="wf-pill">核心</span> : null}
      </div>
      <div className="wf-metric-value">{item.value}</div>
      <div className={`wf-metric-delta is-${item.tone}`}>
        {item.delta >= 0 ? "▲" : "▼"} {Math.abs(item.delta)}%
        <span className="wf-metric-hint">环比</span>
      </div>
      <Sparkline points={item.series} tone={item.tone} />
    </div>
  );
}

export default function DashboardScenario() {
  const [items] = useState(DATA);
  return (
    <Waterfall
      items={items}
      containerStyle={{ height: 420 }}
      keyExtractor={(item) => item.id}
      renderItem={(item, index) => <MetricCard item={item} pinned={index < 2} />}
    />
  );
}
