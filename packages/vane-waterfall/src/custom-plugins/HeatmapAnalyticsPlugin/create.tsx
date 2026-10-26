import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type HeatmapAnalyticsConfig = {
  /** 是否显示顶部统计汇总条（默认 false） */
  showOverlay?: boolean;
  /** 别名：示例页使用的 showOverlaySummary */
  showOverlaySummary?: boolean;
};

/**
 * HeatmapAnalyticsPlugin - 点击/曝光热力分析（基础版）
 * - 统计每项进入视口次数与点击次数
 * - 可选在顶部显示统计摘要叠层
 */
export function createHeatmapAnalyticsPlugin<T = any>(
  config: HeatmapAnalyticsConfig = {}
): WaterfallPlugin<T> {
  const showOverlay = (config.showOverlay ?? config.showOverlaySummary) ?? false;

  const views = new Map<number, number>();
  const clicks = new Map<number, number>();
  let initialCountDone = false;

  return {
    name: "HeatmapAnalyticsPlugin",
    enabled: true,
    hooks: {
      onLayoutComplete: (context) => {
        // 首次布局完成后，统计当前可见范围的曝光，避免首次渲染为 0
        if (initialCountDone) return;
        const { start, end } = context.visibleRange;
        for (let i = start; i <= end; i++) {
          views.set(i, (views.get(i) || 0) + 1);
        }
        initialCountDone = true;
      },
      onItemEnterViewport: (_context, index) => {
        views.set(index, (views.get(index) || 0) + 1);
      },
      onItemClick: (_context, index) => {
        clicks.set(index, (clicks.get(index) || 0) + 1);
      },
      renderOverlay: () => {
        if (!showOverlay) return null;
        const totalViews = Array.from(views.values()).reduce((a, b) => a + b, 0);
        const totalClicks = Array.from(clicks.values()).reduce((a, b) => a + b, 0);

        return (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "6px 10px",
              background: "rgba(0,0,0,0.6)",
              color: "white",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            <span>曝光总计: {totalViews}</span>
            <span>点击总计: {totalClicks}</span>
          </div>
        );
      },
    },
  };
}
