import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type ClickAnalyticsConfig = {
  /** 是否在控制台打印每次点击（默认 false） */
  log?: boolean;
  /** 是否显示右上角计数角标（默认 false，生产版式应关闭） */
  showOverlay?: boolean;
};

/** `getStats()` 的返回形状：够平，直接 `JSON.stringify` 就能上报 */
export type ClickAnalyticsStats = {
  total: number;
  byIndex: Array<{ index: number; clicks: number }>;
};

/**
 * ClickAnalyticsPlugin - 点击分析（基础版）
 * - 统计点击次数，向 bus 发送事件：analytics:click
 * - 可选控制台输出日志
 * - `getStats()` 把内存里的计数吐出来，方便接到自己的上报通道
 */
export function createClickAnalyticsPlugin<T = any>(
  config: ClickAnalyticsConfig = {}
): WaterfallPlugin<T> & { getStats: () => ClickAnalyticsStats } {
  const { log = false, showOverlay = false } = config;
  /** 按 index 计数：总数从它求和得到，避免两处状态不同步 */
  const clicks = new Map<number, number>();
  const total = () => Array.from(clicks.values()).reduce((a, b) => a + b, 0);

  return {
    name: "ClickAnalyticsPlugin",
    enabled: true,
    getStats: () => ({
      total: total(),
      byIndex: Array.from(clicks.entries())
        .map(([index, count]) => ({ index, clicks: count }))
        .sort((a, b) => a.index - b.index),
    }),
    hooks: {
      onMount: (context) => {
        context.sharedData?.set("click-count", total());
      },
      onItemClick: (context, index, item, event) => {
        const next = (clicks.get(index) ?? 0) + 1;
        clicks.set(index, next);
        const sum = total();
        context.sharedData?.set("click-count", sum);
        context.bus?.emit("analytics:click", { index, item, event, total: sum });
        if (log) {
          // 基本日志输出，避免过多信息
          console.log(`[ClickAnalytics] item=${index} total=${sum}`);
        }
      },
      renderOverlay: (context) => {
        if (!showOverlay) return null;
        const total = context.sharedData?.get("click-count") || 0;
        return (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "10px 12px",
              background: "#222",
              color: "#fff",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.15)",
              pointerEvents: "none",
              zIndex:99
            }}
          >
            点击次数：{total}
            <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.85, marginTop: 4 }}>
              提示：点击任意卡片观察计数变化
            </div>
          </div>
        );
      },
    },
  };
}
