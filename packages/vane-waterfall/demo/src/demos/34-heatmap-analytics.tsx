/**
 * 34 · HeatmapAnalytics 插件
 *
 * 统计每项曝光次数与点击次数，可选顶部汇总条。这里同时接了 Core 的 onItemEnterViewport，
 * 用来对照「插件统计到的曝光」和「Core 报的可见事件」是不是同一批。
 *
 * 曝光是瀑布流里最容易统计错的东西：一屏几十项、滚动时反复进出视口，
 * 直接在每个卡片里写 IntersectionObserver 会重复上报 —— 这就是这个插件存在的理由。
 */
import { createHeatmapAnalyticsPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "heatmap-analytics",
  title: "HeatmapAnalytics 插件",
  group: "plugin",
  plugin: "HeatmapAnalyticsPlugin",
  intro: "滚一遍，顶部汇总条告诉你曝光了多少次、点了多少下。",
  why: "内容分发要看「哪些真的被看到了」，不是「哪些被加载了」。曝光埋点交给插件，业务侧只消费汇总。",
  plugs: [
    {
      fn: "createHeatmapAnalyticsPlugin",
      cfg: "showOverlay: true",
      why: "在项进入视口时累加曝光、点击时累加点击，并在 onLayoutComplete 补一次首屏统计",
    },
  ],
  props: ["columns={4}", "containerStyle={{ height: 420 }}"],
  note: "首屏曝光靠 onLayoutComplete 补一次，否则第一帧显示 0。真实上报要自己做去重与批次（插件只负责计数）。",
};

export default createFeedStage({
  count: 36,
  seed: 5001,
  instrument: true,
  plugins: () => [createHeatmapAnalyticsPlugin({ showOverlay: true })],
  coreProps: (api) => {
    let seen = 0;
    return {
      columns: 4,
      gap: 10,
      onItemEnterViewport: (i: number) => {
        seen += 1;
        // 只记前 8 条，避免日志被曝光事件刷满
        if (seen <= 8) api.log(`曝光 #${i}（Core 的可见事件，插件也在数）`, "info");
      },
    };
  },
  chrome: () => <p className="stage-tip">滚一遍：顶部条是开关，卡片角上是单卡曝光/点击次数</p>,
});
