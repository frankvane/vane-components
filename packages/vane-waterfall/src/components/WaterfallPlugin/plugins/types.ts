/**
 * vane-waterfall 领域类型层。
 *
 * 与 @vane/plugin-core 的关系（tasks/07 · 4.1–4.7）：
 *  - `WaterfallPluginContext` = 内核 `PluginContext<WaterfallCoreProps, WaterfallData>` + 领域字段；
 *  - `WaterfallPluginHooks` 按 D3 收口到 **20 个**（旧版声明 48 个，其中 31 个从来没有执行者）；
 *  - `WaterfallPlugin` 从内核 `Plugin` 派生，钩子面收窄为领域钩子。
 *
 * 钩子统一是 `(context, ...args)` 形态——这是内核 `executeHook(hookName, context, ...args)`
 * 的调用约定，旧插件因此可以零改动搬迁（只换 import）。
 */

import type React from "react";
import type { Plugin, PluginContext } from "@vane/plugin-core";
import type { WaterfallCoreProps } from "../WaterfallCore";

// ============ 基础数据类型 ============

/** 项位置（px，相对内容区左上角） */
export interface ItemPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 所属列（0 起） */
  column: number;
  /** 逻辑行号，= floor(index / columns)，仅用于调试与分组展示 */
  row: number;
}

export interface LayoutInfo {
  columns: number;
  columnWidth: number;
  /** 列间距（旧字段名保留，等价于 columnGap） */
  gap: number;
  columnHeights: number[];
  totalHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export interface ViewportInfo {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
  isScrolling: boolean;
  direction: "up" | "down" | "left" | "right" | null;
}

export interface ItemVisibility {
  index: number;
  isVisible: boolean;
  /** 0–1，项与视口的重叠比例 */
  visibleRatio: number;
  isAboveViewport: boolean;
  isBelowViewport: boolean;
}

export interface NetworkInfo {
  effectiveType: "4g" | "3g" | "2g" | "slow-2g";
  downlink: number;
  rtt: number;
  saveData: boolean;
  online: boolean;
}

export interface DragInfo {
  isDragging: boolean;
  draggedIndex: number | null;
  dragStartX: number;
  dragStartY: number;
  dragCurrentX: number;
  dragCurrentY: number;
  dropTargetIndex: number | null;
}

/** 内核 data 位：本领域没有独立数据层，统一挂在 Core 状态快照上 */
export interface WaterfallData {
  items: unknown[];
  layout: LayoutInfo;
  itemPositions: Map<number, ItemPosition>;
  viewport: ViewportInfo;
}

export interface ScrollToOptions {
  behavior?: "auto" | "smooth";
  offset?: number;
}

export interface ScrollToItemOptions extends ScrollToOptions {
  block?: "start" | "center" | "end" | "nearest";
  inline?: "start" | "center" | "end" | "nearest";
}

// ============ 领域上下文 ============

export interface WaterfallPluginContext<T = any>
  extends PluginContext<WaterfallCoreProps<T>, WaterfallData> {
  // --- 数据 ---
  items: T[];
  itemCount: number;

  // --- DOM ---
  containerRef: React.RefObject<HTMLDivElement | null>;
  itemRefs: Map<number, HTMLElement>;
  getItemRef: (index: number) => HTMLElement | null;

  // --- 布局 ---
  layout: LayoutInfo;
  itemPositions: Map<number, ItemPosition>;
  getItemPosition: (index: number) => ItemPosition | null;

  // --- 视口 ---
  viewport: ViewportInfo;
  visibleItems: Set<number>;
  visibleRange: { start: number; end: number };

  // --- 状态位 ---
  isLayouting: boolean;
  isScrolling: boolean;
  isDragging: boolean;
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;

  // --- 扩展信息 ---
  /** 内核 shared（Map）的领域别名，旧插件用它做跨插件通信 */
  sharedData: Map<string, any>;
  networkInfo?: NetworkInfo;
  dragInfo?: DragInfo;

  // --- 工具 ---
  relayout: () => void;
  scrollToItem: (index: number, options?: ScrollToItemOptions) => void;
  scrollToTop: (options?: ScrollToOptions) => void;
  scrollToBottom: (options?: ScrollToOptions) => void;
  measureItem: (index: number) => Promise<{ width: number; height: number }>;
}

// ============ 领域钩子（20 个，D3 收口） ============

export interface WaterfallPluginHooks<T = any> {
  // ---- 生命周期（4）----
  /** 可返回清理函数；`manager.clear()` 时逆序执行一次 */
  onMount?(context: WaterfallPluginContext<T>): unknown;
  onUnmount?(context: WaterfallPluginContext<T>): unknown;
  onPropsChange?(
    context: WaterfallPluginContext<T>,
    prev: WaterfallCoreProps<T>,
    next: WaterfallCoreProps<T>
  ): unknown;
  /** 转发前改写 props（链式，按 priority 降序） */
  transformProps?(props: WaterfallCoreProps<T>): WaterfallCoreProps<T>;

  // ---- 布局（6）----
  /** 返回 false 阻止本次布局 */
  onBeforeLayout?(
    context: WaterfallPluginContext<T>
  ): boolean | void | Promise<boolean | void>;
  onLayout?(context: WaterfallPluginContext<T>): unknown;
  onLayoutComplete?(context: WaterfallPluginContext<T>): unknown;
  /** D1-A：返回列数则覆盖 props.columns */
  calculateColumns?(
    context: WaterfallPluginContext<T>,
    containerWidth: number
  ): number | void;
  /** D1-A：返回列宽则覆盖自动计算值 */
  calculateColumnWidth?(
    context: WaterfallPluginContext<T>,
    containerWidth: number,
    columns: number
  ): number | void;
  /** D1-A：返回位置则覆盖列分配结果（置顶、跨列等） */
  calculateItemPosition?(
    context: WaterfallPluginContext<T>,
    index: number,
    itemHeight: number,
    base: ItemPosition
  ): Partial<ItemPosition> | null | void;

  // ---- 项生命周期（5）----
  onItemMount?(context: WaterfallPluginContext<T>, index: number, element: HTMLElement): unknown;
  onItemUnmount?(context: WaterfallPluginContext<T>, index: number): unknown;
  onItemEnterViewport?(
    context: WaterfallPluginContext<T>,
    index: number,
    visibility: ItemVisibility
  ): unknown;
  onItemLeaveViewport?(
    context: WaterfallPluginContext<T>,
    index: number,
    visibility: ItemVisibility
  ): unknown;
  onItemClick?(
    context: WaterfallPluginContext<T>,
    index: number,
    item: T,
    event: React.MouseEvent
  ): unknown;

  // ---- 滚动（3）----
  onScroll?(context: WaterfallPluginContext<T>, scrollTop: number, scrollLeft: number): unknown;
  onResize?(context: WaterfallPluginContext<T>, width: number, height: number): unknown;
  onReachBottom?(context: WaterfallPluginContext<T>, distance: number): unknown;

  // ---- 渲染（2）----
  /** 覆盖层：HOC 保证渲染在滚动容器内部、内容层之上 */
  renderOverlay?(context: WaterfallPluginContext<T>): React.ReactNode;
  /** 项包装管道：把每个项的渲染结果再包一层（拖拽、无障碍语义等） */
  renderItemWrapper?(
    context: WaterfallPluginContext<T>,
    node: React.ReactNode,
    index: number
  ): React.ReactNode;
}

// ============ 插件 ============

/**
 * 领域插件 = 内核插件把 hooks 收窄成领域钩子。
 * 用 Omit 而不是交叉：交叉会同时保留内核 PluginHooks 的索引签名，
 * TS 在推断钩子参数时会取两边的并集，插件里 context 就变成
 * `PluginContext | WaterfallPluginContext` 而拿不到领域字段。
 */
/**
 * 领域插件 = 内核插件把 hooks 收窄成领域钩子。
 * 用 Omit 而不是交叉类型：交叉会同时保留内核 PluginHooks 的索引签名，
 * TS 推断钩子参数时会取两边的并集，插件里的 context 就变成
 * `PluginContext | WaterfallPluginContext`，拿不到领域字段。
 */
export type WaterfallPlugin<T = any> = Omit<Plugin<WaterfallCoreProps<T>>, "hooks"> & {
  hooks: WaterfallPluginHooks<T>;
};

export type WaterfallPluginCreator<Config = any, T = any> = ((
  config?: Config
) => WaterfallPlugin<T>) & {
  meta: import("@vane/plugin-core").PluginDoc;
};
