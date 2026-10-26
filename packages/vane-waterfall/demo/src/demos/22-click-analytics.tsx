/**
 * 22 · ClickAnalytics 插件
 *
 * 插件统计每项点击次数并 `bus.emit("analytics:click", …)`，`showOverlay` 打开时直接在卡片角上显示次数。
 * 页面拿不到 bus，但有 `onItemClick` —— 两条路都演示在这里：角标看插件内部计数，日志看 Core 回调。
 */
import { createClickAnalyticsPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "click-analytics",
  title: "ClickAnalytics 插件",
  group: "plugin",
  plugin: "ClickAnalyticsPlugin",
  intro: "点卡片，角上的计数 +1，日志同时记一条。",
  why: "「哪几张最常被点」这类轻量埋点，用插件比在 renderItem 里到处加 onClick 干净，也不会漏掉没渲染的路径。",
  plugs: [
    {
      fn: "createClickAnalyticsPlugin",
      cfg: "showOverlay: true, log: false",
      why: "订阅 onItemClick 累加计数并广播事件，角标只是可视化的开关",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}", "onItemClick={(i, item) => track(item.id)}"],
  note: "showOverlay 生产环境应关掉（默认就是 false）。真实上报在 bus 上订阅 analytics:click —— 页面侧拿不到 bus 时，可以用 onItemClick 走自己的埋点函数。",
};

export default createFeedStage({
  count: 20,
  seed: 3801,
  instrument: true,
  plugins: () => [createClickAnalyticsPlugin({ showOverlay: true })],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    onItemClick: (i, item: { title: string }) =>
      api.log(`点击 #${i} · ${item.title}（bus 上同时广播 analytics:click）`),
  }),
  chrome: () => <p className="stage-tip">点几张卡：右上角数字是插件自己的计数</p>,
});
