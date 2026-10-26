/**
 * 13 · 大图墙 · 回收 / 防抖 / 热力
 *
 * 这一卡不是某个具体站点，而是「同一个瀑布流上三个性能/观测开关」的组合演示：
 *  · RecyclePlugin —— 离屏项设 visibility:hidden，减少绘制压力（DOM 还在）；
 *  · DebounceLayoutPlugin —— 拖拽窗口时把布局防抖拉长，避免一帧算好几次；
 *  · HeatmapAnalyticsPlugin —— 统计曝光/点击次数，顶栏显示汇总。
 *
 * 与 08 的区别：那边用 Core 自带的 virtualize（真卸载 DOM），这边是「不卸载、只隐藏」。
 * 两者不要同开 —— 见 meta.note。
 */
import React, { useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createAutoColumnPlugin,
  createDebounceLayoutPlugin,
  createGapPlugin,
  createHeatmapAnalyticsPlugin,
  createRecyclePlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "recycle-perf",
  title: "大图墙 · 回收与防抖",
  group: "性能",
  ref: { label: "综合性能实验", url: "https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API" },
  pain: "中等数据量（几百项）时 DOM 不该丢，但离屏项不该继续花绘制成本",
  plugs: [
    { fn: "createRecyclePlugin", cfg: "poolSize: 16", why: "离屏项 visibility:hidden，DOM 保留 → 滚回来不用重建，也不触发图片重载" },
    { fn: "createDebounceLayoutPlugin", cfg: "delay: 140", why: "拖拽窗口时把布局防抖拉到 140ms，避免每帧都重算" },
    { fn: "createHeatmapAnalyticsPlugin", cfg: "showOverlay: true", why: "统计每项曝光/点击，顶栏汇总；验证 onItemEnterViewport 真的在触发" },
    { fn: "createAutoColumnPlugin", cfg: "minColumnWidth: 170, maxColumns: 4", why: "常规自适应列数" },
    { fn: "createGapPlugin", cfg: "columnGap: 12, rowGap: 12", why: "统一间距" },
  ],
  props: [
    "containerStyle={{ height: 420 }}",
    "renderItem={(item) => <Card item={item} />}",
    "onItemClick={(i, item) => track(item)}",
  ],
  note:
    "Recycle 与 Core 的 virtualize 互斥：一个改 visibility、一个直接卸载。选哪个看数据量——几百项用 Recycle，上千项用 virtualize。",
};

const DATA = makeCards({ count: 120, seed: 13101, heightRange: [150, 280] });

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createRecyclePlugin({ poolSize: 16 }),
  createDebounceLayoutPlugin({ delay: 140 }),
  createHeatmapAnalyticsPlugin({ showOverlay: true }),
  createAutoColumnPlugin({ minColumnWidth: 170, maxColumns: 4 }),
  createGapPlugin({ columnGap: 12, rowGap: 12 }),
]);

export default function RecyclePerfScenario() {
  const [items] = useState(DATA);
  return (
    <Waterfall
      items={items}
      containerStyle={{ height: 420 }}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <FeedCard card={item} variant="photo" />}
    />
  );
}
