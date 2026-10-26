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
