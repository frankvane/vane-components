import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type HeatmapAnalyticsConfig = {
  /** 是否显示顶部统计汇总条（默认 false） */
  showOverlay?: boolean;
  /** 别名：示例页使用的 showOverlaySummary */
  showOverlaySummary?: boolean;
};

/**
 * `getStats()` 的返回形状：每项的曝光 / 点击次数。
 *
 * 只列「有数据」的项 —— 上千项时把全零项也吐出来没有意义。
 */
export type HeatmapAnalyticsStats = {
  totalViews: number;
  totalClicks: number;
  /** `index` 是该 key 最近一次出现时的下标；排序 / 分页后以下标对齐统计并不可靠 */
  items: Array<{ index: number; key: string; views: number; clicks: number }>;
};

/**
 * HeatmapAnalyticsPlugin - 点击/曝光热力分析（基础版）
 * - 统计每项进入视口次数与点击次数
 * - 可选在顶部显示统计摘要叠层
 * - `getStats()` 把内存里的统计吐出来，方便接到自己的上报通道
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createHeatmapAnalyticsPlugin<T = unknown>(
  config: HeatmapAnalyticsConfig = {}
): WaterfallPlugin<T> & { getStats: () => HeatmapAnalyticsStats } {
  const showOverlay = (config.showOverlay ?? config.showOverlaySummary) ?? false;

  /** 按稳定 key 计数：排序 / 分页后同一 index 可能已是另一条数据（P2-8） */
  const views = new Map<string, number>();
  const clicks = new Map<string, number>();
  const indexByKey = new Map<string, number>();
  let initialCountDone = false;
  let lastItems: unknown[] | null = null;

  const sum = (m: Map<string, number>) =>
    Array.from(m.values()).reduce((a, b) => a + b, 0);

  const keyOf = (context: WaterfallPluginContext<T>, item: T, index: number): string => {
    try {
      const key = context.props?.keyExtractor?.(item, index);
      if (key !== undefined && key !== null) return String(key);
    } catch {
      /* 消费方的 keyExtractor 抛错不影响埋点 */
    }
    return `#${index}`;
  };

  /**
   * 数据集被替换：清空统计并把首屏曝光计数复位。
   *
   * 旧实现的 `initialCountDone` 是工厂级闭包且从不复位 —— 换了数据以后首屏曝光
   * 一次都不会再计（表现为换页后曝光总计不涨，P2-8）。
   */
  const syncDataset = (context: WaterfallPluginContext<T>) => {
    const items = context.items;
    if (lastItems === null || items !== lastItems) {
      lastItems = items;
      views.clear();
      clicks.clear();
      indexByKey.clear();
      initialCountDone = false;
    }
  };

  return {
    name: "HeatmapAnalyticsPlugin",
    enabled: true,
    getStats: () => {
      const keys = new Set([...views.keys(), ...clicks.keys()]);
      return {
        totalViews: sum(views),
        totalClicks: sum(clicks),
        items: Array.from(keys)
          .map((key) => ({
            index: indexByKey.get(key) ?? 0,
            key,
            views: views.get(key) ?? 0,
            clicks: clicks.get(key) ?? 0,
          }))
          .sort((a, b) => a.index - b.index || a.key.localeCompare(b.key)),
      };
    },
    hooks: {
      onLayoutComplete: (context) => {
        syncDataset(context);
        // 首次布局完成后，统计当前可见范围的曝光，避免首次渲染为 0
        if (initialCountDone) return;
        const { start, end } = context.visibleRange;
        const items = context.items;
        for (let i = start; i <= end; i++) {
          const item = items[i];
          if (item === undefined) continue;
          const key = keyOf(context, item as T, i);
          indexByKey.set(key, i);
          views.set(key, (views.get(key) || 0) + 1);
        }
        initialCountDone = true;
      },
      onItemEnterViewport: (context, index) => {
        syncDataset(context);
        const item = context.items[index];
        if (item === undefined) return;
        const key = keyOf(context, item as T, index);
        indexByKey.set(key, index);
        views.set(key, (views.get(key) || 0) + 1);
      },
      onItemClick: (context, index, item) => {
        syncDataset(context);
        const key = keyOf(context, item, index);
        indexByKey.set(key, index);
        clicks.set(key, (clicks.get(key) || 0) + 1);
        // 同 ClickAnalytics：统计只在闭包里，不请求重渲染的话顶部汇总条
        // 要等到下次布局 / 滚动才更新
        context.forceUpdate?.();
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
