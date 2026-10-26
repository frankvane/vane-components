/**
 * 22 · ClickAnalytics 插件
 *
 * 插件统计每项点击次数并 `bus.emit("analytics:click", …)`，`showOverlay` 打开时直接在卡片角上显示次数。
 * 页面拿不到 bus，但有 `onItemClick` —— 两条路都演示在这里：角标看插件内部计数，日志看 Core 回调。
 *
 * 「导出 JSON」按钮演示的是接入姿势：插件的计数原本只在内存里，刷新即清零，
 * 真接自己的埋点通道时就是从 `getStats()` 取这份数据往上报。
 */
import { createClickAnalyticsPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { SeedCard } from "../data/seed";
import type { DemoMeta } from "./types";

// 提到模块级：chrome 里的「导出」按钮要读同一份统计
const clickPlugin = createClickAnalyticsPlugin<SeedCard>({ showOverlay: true });

export const meta: DemoMeta = {
  slug: "click-analytics",
  title: "ClickAnalytics 插件",
  group: "plugin",
  plugin: "ClickAnalyticsPlugin",
  intro: "点卡片，角上的计数 +1，日志同时记一条；「导出 JSON」把内存计数吐出来。",
  why: "「哪几张最常被点」这类轻量埋点，用插件比在 renderItem 里到处加 onClick 干净，也不会漏掉没渲染的路径。",
  plugs: [
    {
      fn: "createClickAnalyticsPlugin",
      cfg: "showOverlay: true, log: false",
      why: "订阅 onItemClick 累加计数并广播事件，角标只是可视化的开关",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}", "onItemClick={(i, item) => track(item.id)}"],
  note: "showOverlay 生产环境应关掉（默认就是 false）。真实上报在 bus 上订阅 analytics:click —— 页面侧拿不到 bus 时，可以用 onItemClick 走自己的埋点函数，或者像右上角那样定时取 getStats() 批量上报（计数只在内存里，刷新即清零）。",
};

export default createFeedStage({
  count: 20,
  seed: 3801,
  instrument: true,
  plugins: () => [clickPlugin],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    onItemClick: (i, item: { title: string }) =>
      api.log(`点击 #${i} · ${item.title}（bus 上同时广播 analytics:click）`),
  }),
  chrome: (api) => (
    <div className="stage-stats">
      <p className="stage-tip">点几张卡：右上角数字是插件自己的计数</p>
      <button
        type="button"
        onClick={() => {
          const stats = clickPlugin.getStats();
          api.log(`getStats() → ${JSON.stringify(stats)}`);
          void navigator.clipboard?.writeText(JSON.stringify(stats, null, 2)).catch(() => {});
        }}
      >
        导出 JSON
      </button>
    </div>
  ),
});
