import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type AutoColumnConfig = {
  /** 每列最小宽度（含内容区，不含列间距） */
  minColumnWidth: number;
  /** 最大列数（可选） */
  maxColumns?: number;
  /** 最小列数（可选，默认 1） */
  minColumns?: number;
};

/**
 * AutoColumnPlugin - 按「容器可用宽度 ÷ 最小列宽」自动决定列数。
 *
 * 走 D1-A 布局钩子 `calculateColumns`：容器宽度与 padding / columnGap 都由 Core
 * 现算好传进来，不用再拿 window.innerWidth 近似（旧版那样在窄容器里会多排一列）。
 * 公式：columns = floor((available + columnGap) / (minColumnWidth + columnGap))
 */
export function createAutoColumnPlugin<T = any>(
  config: AutoColumnConfig
): WaterfallPlugin<T> {
  if (!(config.minColumnWidth > 0)) {
    throw new Error("[vane-waterfall] AutoColumnPlugin 需要正数的 minColumnWidth");
  }

  return {
    name: "AutoColumnPlugin",
    priority: 55,
    enabled: true,
    hooks: {
      calculateColumns: (context: WaterfallPluginContext<T>, containerWidth: number) => {
        const props = context.props;
        const columnGap = props.columnGap ?? props.gap ?? 0;
        const padding = props.padding;
        const horizontalPadding =
          typeof padding === "number"
            ? padding * 2
            : (padding?.left ?? 0) + (padding?.right ?? 0);

        const available = Math.max(0, containerWidth - horizontalPadding);
        if (!available) return props.columns ?? 1;

        const base = Math.max(
          1,
          Math.floor((available + columnGap) / (config.minColumnWidth + columnGap))
        );
        const minCols = Math.max(1, config.minColumns ?? 1);
        const maxCols = config.maxColumns ?? Number.POSITIVE_INFINITY;
        return Math.min(Math.max(base, minCols), maxCols);
      },
    },
  };
}
