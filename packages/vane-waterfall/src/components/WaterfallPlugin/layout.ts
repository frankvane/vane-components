/**
 * 瀑布流布局算法（纯函数，无 React / 无 DOM）。
 *
 * 与旧 `WaterfallCore.calculateLayout` 的差异只有三处，其余逐字保留（见
 * `test/fixtures/layout-snapshots.json` 的等价性断言）：
 *
 *  1. 抽出纯函数，高度由调用方传入（旧版直接读 `element.offsetHeight`）；
 *  2. 支持 `estimateHeight`：未测量项按估值占位。旧版 `itemHeight === 0` 直接
 *     `continue`，虚拟化开启后未渲染项永远测不到高度 → 总高严重偏小。这是
 *     旧 `VirtualWaterfallPlugin` 最致命的缺陷；
 *  3. 支持 D1-A 的三个布局钩子（列数 / 列宽 / 单项位置），返回值优先于默认值。
 *
 * 保留的旧行为（有意的，不要"顺手优化"）：
 *  - 每项后面都加一次 `rowGap`，因此 `totalHeight` 比视觉底边多一个 `rowGap`；
 *  - `balanced` 与 `shortest` 在列高相同时都取最小索引列（左优先）；
 *  - `row` 字段是逻辑行号 `floor(index / columns)`，与视觉行无关。
 */

import type { ItemPosition } from "./plugins/types";

export type AlignmentMode = "shortest" | "balanced" | "sequential";

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function normalizePadding(
  padding: number | Partial<Padding> = 0
): Padding {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

export interface LayoutHooks {
  calculateColumns?: (base: number) => number | void;
  calculateColumnWidth?: (
    base: number,
    columns: number,
    containerWidth: number
  ) => number | void;
  calculateItemPosition?: (
    index: number,
    itemHeight: number,
    base: ItemPosition
  ) => Partial<ItemPosition> | null | void;
}

export interface LayoutParams {
  /** 每项高度；0 / undefined / NaN 视为「未测量」 */
  heights: Array<number | undefined>;
  columns: number;
  containerWidth: number;
  columnGap: number;
  rowGap: number;
  padding?: number | Partial<Padding>;
  alignmentMode?: AlignmentMode;
  /** 未测量项的兜底高度。不给 → 沿用旧行为：跳过不占位 */
  estimateHeight?: number;
  hooks?: LayoutHooks;
}

export interface LayoutResult {
  columns: number;
  columnWidth: number;
  padding: Padding;
  columnHeights: number[];
  totalHeight: number;
  positions: Map<number, ItemPosition>;
  /** 本次布局里有多少项是拿估值占位的（虚拟化给调试面板用） */
  estimatedCount: number;
}

/** 单项高度：已测量用真值，未测量用估值，都没有则返回 0（跳过） */
function resolveHeight(height: number | undefined, estimate?: number): number {
  if (typeof height === "number" && Number.isFinite(height) && height > 0) {
    return height;
  }
  return estimate && estimate > 0 ? estimate : 0;
}

export function computeLayout(params: LayoutParams): LayoutResult {
  const {
    heights,
    columnGap,
    rowGap,
    alignmentMode = "shortest",
    estimateHeight,
    hooks,
  } = params;

  const padding = normalizePadding(params.padding);
  const containerWidth = params.containerWidth;

  // ---- D1-A 执行点 1：列数 ----
  const hookColumns = hooks?.calculateColumns?.(params.columns);
  const columns = Math.max(
    1,
    Math.round(
      typeof hookColumns === "number" && Number.isFinite(hookColumns)
        ? hookColumns
        : params.columns
    )
  );

  const contentWidth = containerWidth - padding.left - padding.right;
  const autoColumnWidth = (contentWidth - columnGap * (columns - 1)) / columns;

  // ---- D1-A 执行点 2：列宽 ----
  const hookColumnWidth = hooks?.calculateColumnWidth?.(
    autoColumnWidth,
    columns,
    containerWidth
  );
  const columnWidth =
    typeof hookColumnWidth === "number" && Number.isFinite(hookColumnWidth)
      ? hookColumnWidth
      : autoColumnWidth;

  const columnHeights = Array(columns).fill(padding.top);
  const columnCounts = Array(columns).fill(0);
  const positions = new Map<number, ItemPosition>();
  let estimatedCount = 0;

  if (heights.length === 0) {
    return {
      columns,
      columnWidth,
      padding,
      columnHeights,
      totalHeight: padding.top + padding.bottom,
      positions,
      estimatedCount: 0,
    };
  }

  for (let i = 0; i < heights.length; i++) {
    const measured = heights[i];
    const itemHeight = resolveHeight(measured, estimateHeight);
    if (itemHeight === 0) continue;
    if (!(typeof measured === "number" && measured > 0)) estimatedCount += 1;

    // ---- 列分配（旧版三种策略，顺序与比较逻辑逐字保留）----
    let column = 0;
    if (alignmentMode === "sequential") {
      column = i % columns;
    } else if (alignmentMode === "balanced") {
      let minCount = columnCounts[0];
      for (let c = 1; c < columns; c++) {
        if (columnCounts[c] < minCount) {
          minCount = columnCounts[c];
          column = c;
        }
      }
    } else {
      let minHeight = columnHeights[0];
      for (let c = 1; c < columnHeights.length; c++) {
        if (columnHeights[c] < minHeight) {
          minHeight = columnHeights[c];
          column = c;
        }
      }
    }

    let position: ItemPosition = {
      x: padding.left + column * (columnWidth + columnGap),
      y: columnHeights[column],
      width: columnWidth,
      height: itemHeight,
      column,
      row: Math.floor(i / columns),
    };

    // ---- D1-A 执行点 3：单项位置 ----
    const override = hooks?.calculateItemPosition?.(i, itemHeight, position);
    if (override) {
      const merged: ItemPosition = { ...position, ...override };
      // 不变式：`column` 与 `x` 必须一致。
      // 把项换列的插件（PinItem 等）算不出**本轮**的 columnWidth，只能返回 column；
      // 早先它们各自用 `base.width + columnGap` 反推 x，gap 一旦来自 transformProps
      // 就反推错（少一个 columnGap）。这里统一按本轮列宽补 x，插件不必自己算。
      // 显式给了 x 的以插件为准（跨列、自定义排版）。
      if (override.column !== undefined && override.x === undefined) {
        merged.x =
          padding.left +
          Math.min(Math.max(0, merged.column), columns - 1) * (columnWidth + columnGap);
      }
      position = merged;
    }

    positions.set(i, position);

    // 列高推进只认 position，不认「谁返回了什么」——插件要跨列由它自己改 column
    const targetColumn = Math.min(
      Math.max(0, position.column),
      columnHeights.length - 1
    );
    columnHeights[targetColumn] = position.y + position.height + rowGap;
    columnCounts[targetColumn] += 1;
  }

  return {
    columns,
    columnWidth,
    padding,
    columnHeights,
    totalHeight: Math.max(...columnHeights) + padding.bottom,
    positions,
    estimatedCount,
  };
}

/** `scrollToItem` 的滚动量（纯计算，供 Core 与单测共用） */
export function computeScrollTopForItem(
  position: ItemPosition,
  clientHeight: number,
  block: "start" | "center" | "end" | "nearest" = "start",
  offset = 0
): number {
  let scrollTop = position.y + offset;
  if (block === "center") {
    scrollTop -= clientHeight / 2 - position.height / 2;
  } else if (block === "end") {
    scrollTop -= clientHeight - position.height;
  }
  return Math.max(0, scrollTop);
}
