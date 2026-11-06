import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type ClickAnalyticsConfig = {
  /** 是否在控制台打印每次点击（默认 false） */
  log?: boolean;
  /** 是否显示右上角计数角标（默认 false，生产版式应关闭） */
  showOverlay?: boolean;
};

/** `getStats()` 的返回形状：够平，直接 `JSON.stringify` 就能上报 */
export type ClickAnalyticsStats = {
  total: number;
  /** `index` 是该 key 最近一次出现时的下标；数据被排序 / 分页后以 `key` 为准 */
  byIndex: Array<{ index: number; key: string; clicks: number }>;
};

/**
 * ClickAnalyticsPlugin - 点击分析（基础版）
 * - 统计点击次数，向 bus 发送事件：analytics:click
 * - 可选控制台输出日志
 * - `getStats()` 把内存里的计数吐出来，方便接到自己的上报通道
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createClickAnalyticsPlugin<T = unknown>(
  config: ClickAnalyticsConfig = {}
): WaterfallPlugin<T> & { getStats: () => ClickAnalyticsStats } {
  const { log = false, showOverlay = false } = config;
  /**
   * 按**稳定 key** 计数，不按 index。
   *
   * 排序 / 筛选 / 分页之后同一个下标可能已经是另一条数据，按 index 统计会把点击
   * 算到别的项头上（P2-8）。key 取 `keyExtractor` 的结果，取不到才退回 index。
   */
  const clicks = new Map<string, number>();
  const indexByKey = new Map<string, number>();
  let lastItems: unknown[] | null = null;
  const total = () => Array.from(clicks.values()).reduce((a, b) => a + b, 0);

  const keyOf = (context: WaterfallPluginContext<T>, item: T, index: number): string => {
    try {
      const key = context.props?.keyExtractor?.(item, index);
      if (key !== undefined && key !== null) return String(key);
    } catch {
      /* 消费方的 keyExtractor 抛错不影响埋点 */
    }
    return `#${index}`;
  };

  /** 数据集被替换（新数组）时清零：旧计数对应的已经不是这批数据了 */
  const syncDataset = (context: WaterfallPluginContext<T>) => {
    const items = context.items;
    if (lastItems === null || items !== lastItems) {
      lastItems = items;
      clicks.clear();
      indexByKey.clear();
      context.sharedData?.set("click-count", 0);
    }
  };

  return {
    name: "ClickAnalyticsPlugin",
    enabled: true,
    getStats: () => ({
      total: total(),
      byIndex: Array.from(clicks.entries())
        .map(([key, count]) => ({
          index: indexByKey.get(key) ?? 0,
          key,
          clicks: count,
        }))
        .sort((a, b) => a.index - b.index || a.key.localeCompare(b.key)),
    }),
    hooks: {
      onMount: (context) => {
        context.sharedData?.set("click-count", total());
      },
      onLayoutComplete: (context) => {
        syncDataset(context);
      },
      onItemClick: (context, index, item, event) => {
        syncDataset(context);
        const key = keyOf(context, item, index);
        indexByKey.set(key, index);
        const next = (clicks.get(key) ?? 0) + 1;
        clicks.set(key, next);
        const sum = total();
        context.sharedData?.set("click-count", sum);
        context.bus?.emit("analytics:click", { index, key, item, event, total: sum });
        // 计数只存在闭包 Map 里，宿主不会因为「点了一下」重渲染；
        // 不主动请求一次，`renderOverlay` 要等到下次布局 / 滚动才重算，
        // 表现就是「点了数字不动，一滚动才跳变」。
        context.forceUpdate?.();
        if (log) {
          // 基本日志输出，避免过多信息
          console.log(`[ClickAnalytics] item=${index} total=${sum}`);
        }
      },
      renderOverlay: (context) => {
        if (!showOverlay) return null;
        // value 形状由本插件的 key 约定决定（数字计数），读取处断言
        const total = (context.sharedData?.get("click-count") as number | undefined) || 0;
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
