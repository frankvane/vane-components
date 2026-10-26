/**
 * 虚拟化：只决定「渲染哪些项」，不改布局。
 *
 * 旧版 `VirtualWaterfallPlugin`（254 行）用 `transformProps` 把 `renderItem` 置空、
 * 再在 overlay 里自绘并绝对定位，等于把 Core 架空：`itemPositions` / `scrollToItem` /
 * `measureItem` / `onItemEnterViewport` 全部脱钩，滚动高度靠 overlay 自己撑。
 * 这里改成 Core 的一个选项，布局仍由 `layout.ts` 算全量，只裁渲染。
 */

import type { ItemPosition } from "./plugins/types";

export interface VirtualizeOptions {
  /** 视口上下各多渲染几屏，默认 1 */
  overscan?: number;
  /** 未测量项的兜底高度，默认 240。不设则虚拟化等于不开（未测量项不占位） */
  estimateHeight?: number;
  /**
   * 是否允许高度动态变化（图片加载后重排），默认 true。
   * 关掉后项一旦测量就不再重新监听尺寸，适合固定高度的商品卡。
   */
  dynamicHeights?: boolean;
  /**
   * 未测量项的高度估值是否跟随实测样本自适应，默认 **true**。
   *
   * 为什么要有：`estimateHeight` 是一个固定值，而真实项高必然是一个区间。
   * 只要真实项比估值高，同一列里排在它后面的未测量项就会被压上去 —— 表现为
   * 快速滚动时卡片重叠。改成跟实测样本的分位数走之后，估值天然贴着这份数据，
   * 重叠幅度可以压到个位数像素（见 `resolveEstimateHeight`）。
   *
   * 设为 false 时严格用 `estimateHeight`：适合「所有项等高」的固定高卡片，
   * 此时估值就是精确值，不需要样本。
   */
  adaptiveEstimate?: boolean;
  /**
   * 自适应时取样本的哪个分位，默认 0.5（中位数）。
   *
   * 为什么是中位数：总高是「所有项高度之和」决定的，中位数是使总高误差最小的
   * 单值估计。重叠问题不靠抬高估值解决 —— 抬高估值只是把误差从「重叠」换成
   * 「滚动条虚长」，后者更持久、更刺眼。真正压住重叠的是「测量到就立刻重排」
   * （`scheduleLayoutNow`），它让估值误差只存在一帧、且通常落在视口外。
   *
   * 如果想更保守（例如项高分布极其离散），可以调到 0.9。
   */
  estimateQuantile?: number;
}

/** 自适应估值至少要有这么多实测样本才敢用，否则仍走 `estimateHeight` */
export const MIN_ESTIMATE_SAMPLES = 8;

/**
 * 算未测量项该用多高。
 *
 * @param samples 已测量到的项高（可为空）
 * @param fallback `estimateHeight`，冷启动 / 关闭自适应时用
 * @param quantile 分位，默认 0.5（中位数）
 */
export function resolveEstimateHeight(
  samples: Iterable<number>,
  fallback: number,
  quantile = 0.5
): number {
  const list: number[] = [];
  for (const h of samples) {
    if (Number.isFinite(h) && h > 0) list.push(h);
  }
  if (list.length < MIN_ESTIMATE_SAMPLES) return fallback;
  list.sort((a, b) => a - b);
  const q = Math.min(1, Math.max(0, quantile));
  const idx = Math.min(list.length - 1, Math.round(q * (list.length - 1)));
  // 向上取整到 1px：避免亚像素估值让布局出现半像素漂移
  return Math.max(1, Math.ceil(list[idx]));
}

export interface VisibleRange {
  start: number;
  end: number;
  /** 命中范围之外还有多少项没渲染（调试面板用） */
  hiddenCount: number;
}

/**
 * 计算需要渲染的索引区间（闭区间）。
 *
 * @param positions 全量布局结果
 * @param totalCount 数据总长（含尚未进入布局的新项）
 * @param scrollTop 容器滚动偏移
 * @param viewportHeight 容器可视高度
 * @param overscan 上下各多渲染几屏
 */
export function computeVisibleRange(
  positions: Map<number, ItemPosition>,
  totalCount: number,
  scrollTop: number,
  viewportHeight: number,
  overscan = 1
): VisibleRange {
  if (totalCount <= 0) return { start: 0, end: -1, hiddenCount: 0 };

  // 还没布局（首帧）：给一个保守窗口，避免整表渲染
  if (positions.size === 0) {
    const guess = Math.max(1, Math.ceil(viewportHeight / 240) + 2);
    return { start: 0, end: Math.min(totalCount - 1, guess - 1), hiddenCount: 0 };
  }

  const pad = Math.max(0, viewportHeight * overscan);
  const top = scrollTop - pad;
  const bottom = scrollTop + Math.max(viewportHeight, 1) + pad;

  let start = Number.POSITIVE_INFINITY;
  let end = -1;

  positions.forEach((p, index) => {
    const itemTop = p.y;
    const itemBottom = p.y + p.height;
    if (itemBottom > top && itemTop < bottom) {
      if (index < start) start = index;
      if (index > end) end = index;
    }
  });

  // 视口内一项都没命中（比如滚过头）：退化成「离滚动位置最近的窗口」
  if (end < 0) {
    let nearest = 0;
    let minDelta = Number.POSITIVE_INFINITY;
    positions.forEach((p, index) => {
      const delta = Math.abs(p.y - scrollTop);
      if (delta < minDelta) {
        minDelta = delta;
        nearest = index;
      }
    });
    const width = Math.max(1, Math.ceil(viewportHeight / 240) + 2);
    start = Math.max(0, nearest - width);
    end = Math.min(totalCount - 1, nearest + width);
  }

  start = Math.max(0, start);
  end = Math.min(totalCount - 1, end);
  if (end < start) end = start;

  const rendered = end - start + 1;
  return { start, end, hiddenCount: Math.max(0, totalCount - rendered) };
}
