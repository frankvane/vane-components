import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type ClickAnalyticsConfig = {
  /** 是否在控制台打印每次点击（默认 false） */
  log?: boolean;
  /** 是否显示右上角计数角标（默认 false，生产版式应关闭） */
  showOverlay?: boolean;
};

/**
 * ClickAnalyticsPlugin - 点击分析（基础版）
 * - 统计点击次数，向 bus 发送事件：analytics:click
 * - 可选控制台输出日志
 */
export function createClickAnalyticsPlugin<T = any>(config: ClickAnalyticsConfig = {}): WaterfallPlugin<T> {
  const { log = false, showOverlay = false } = config;
  return {
    name: "ClickAnalyticsPlugin",
    enabled: true,
    hooks: {
      onMount: (context) => {
        context.sharedData?.set("click-count", 0);
      },
      onItemClick: (context, index, item, event) => {
        const prev = context.sharedData?.get("click-count") || 0;
        const next = prev + 1;
        context.sharedData?.set("click-count", next);
        context.bus?.emit("analytics:click", { index, item, event, total: next });
        if (log) {
          // 基本日志输出，避免过多信息
          console.log(`[ClickAnalytics] item=${index} total=${next}`);
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
