/**
 * WaterfallCore - 瀑布流核心组件
 *
 * 职责（与插件系统的边界，见 tasks/07 · 4.4）：
 *  1. 测量容器与项、算布局（`layout.ts`）；
 *  2. 处理滚动、尺寸变化、视口可见性；
 *  3. 维护 `itemPositions` 与 ref 契约（`relayout` / `scrollToItem` / `measureItem` …）；
 *  4. 把生命周期回调交给 HOC（`withPlugins`）桥接成插件钩子链。
 *
 * 不做什么：
 *  - 不内置任何业务行为（分组、吸顶、拖拽、埋点都在插件里）；
 *  - 不接管渲染内容（`renderItem` 由调用方给，插件可通过 `renderItemWrapper` 包一层）。
 *
 * 相对旧实现（旧仓库/vane-waterfall）的改动：
 *  - 布局抽成纯函数 `layout.ts`，支持 D1-A 三个布局钩子；
 *  - 新增 `virtualize`（D2-A），只裁渲染不裁布局；
 *  - 项级 ResizeObserver 在容器卸载时统一 disconnect（旧版只靠 ref 回调传 null）；
 *  - `measuredHeights` 单独缓存：虚拟化把项卸载后仍记得真实高度；
 *  - 项的 ref 回调按 index 缓存成稳定函数。旧版每次 render 都新建闭包，React 会把
 *    旧回调以 null 调一次、新回调以 el 调一次 → `onItemMount` / `onItemUnmount`
 *    每渲染都触发一遍（埋点类插件因此重复上报）。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ItemPosition,
  ItemVisibility,
  LayoutInfo,
  ViewportInfo,
} from "./plugins/types";
import {
  computeLayout,
  computeScrollTopForItem,
  type AlignmentMode,
  type LayoutHooks,
} from "./layout";
import { computeVisibleRange, resolveEstimateHeight, type VirtualizeOptions } from "./virtualize";

// ============ Props ============

/**
 * T 默认 any：与 plugins/types.ts 的「泛型默认值说明」同因。
 * 大量消费方以 `WaterfallCoreProps`（不写泛型）标注 props，默认值收紧成 unknown
 * 会让 renderItem / keyExtractor 的参数退化为 unknown。
 */
export interface WaterfallCoreProps<T = any> {
  // ---- 数据 ----
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => React.Key;

  // ---- 布局 ----
  /** 列数，默认 3；插件可通过 `calculateColumns` 覆盖 */
  columns?: number;
  /** 行/列间距的简写，默认 16 */
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  /**
   * 列分配策略，默认 shortest
   * - shortest：放进当前最矮的列
   * - balanced：放进项数最少的列
   * - sequential：按 index 轮转
   */
  alignmentMode?: AlignmentMode;
  /** 容器内边距 */
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };

  // ---- 样式 ----
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  itemStyle?: React.CSSProperties;
  itemClassName?: string;
  /** 用 transform 定位（默认 true）；需要读 offsetLeft / 打印时传 false */
  useTransform?: boolean;

  // ---- 性能 ----
  throttleDelay?: number;
  debounceDelay?: number;
  /**
   * 距底部多少像素内触发 `onReachBottom`，默认 100。
   * 无限滚动类插件靠它提前预加载（旧版写死 100，插件配多大都没用）。
   */
  reachBottomOffset?: number;
  /**
   * 零高度项的最小占位高度，默认 48（设 0 关闭，退回旧行为：该项不占位且不可见）。
   *
   * 图片 404 / 懒加载尚未解码 / 字体度量未就绪时首测 `offsetHeight` 为 0，
   * 旧实现直接跳过 → 该DOM 节点被 `opacity:0` 隐藏、不在 `positions` 里，
   * `scrollToItem` / `onItemEnterViewport` 也永远命中不到。
   */
  minItemHeight?: number;
  /**
   * 滚动锚定：布局前后补偿 `scrollTop`，让第一个可见项在屏幕上的位置不变，默认 true。
   * 视口上方的项从估值变成真高时，不补偿会让内容整体「跳一下」。
   */
  scrollAnchor?: boolean;
  /** 是否还有更多数据（`InfiniteScrollPlugin` 读取），优先于插件内部状态 */
  hasMore?: boolean;
  /** 数据是否在加载中（`aria-busy` 等读取），优先于插件内部状态 */
  isLoading?: boolean;
  /**
   * 虚拟化：只渲染视口附近的项。
   * 千项以上、项高度可估（图片卡、商品卡）时开；与 `RecyclePlugin` 不要同开。
   */
  virtualize?: boolean | VirtualizeOptions;

  // ---- 数据管线（插件读取；Core 自己不消费，但放在 props 上才可被 transformProps 链传递）----
  /** FilterPlugin 读取；优先级高于工厂里的 predicate */
  filterFn?: (item: T, index: number) => boolean;
  /** SortPlugin 读取；优先级高于工厂里的 comparator */
  sortComparator?: (a: T, b: T) => number;
  /** SearchPlugin 读取 */
  searchQuery?: string;
  /** PaginationPlugin 读取，1 基 */
  pageIndex?: number;
  /** PaginationPlugin 读取 */
  pageSize?: number;
  /** InfiniteScrollPlugin 读取 */
  onLoadMore?: () => void | Promise<void>;
  /** 数据条件变化后是否回顶（各插件分别读自己那个键） */
  scrollToTopOnFilterChange?: boolean;
  scrollToTopOnSortChange?: boolean;
  scrollToTopOnSearchChange?: boolean;
  scrollToTopOnPageChange?: boolean;
  /** 回顶行为，默认 auto */
  scrollToTopBehavior?: "auto" | "smooth";

  // ---- 由 withPlugins 注入 ----
  /** D1-A 布局钩子（HOC 从插件装配结果里汇总） */
  layoutHooks?: LayoutHooks;

  // ---- 生命周期回调（由 HOC 桥接成插件钩子）----
  onMount?: () => void;
  onUnmount?: () => void;
  onBeforeLayout?: () => boolean | void | Promise<boolean | void>;
  onLayout?: () => void;
  onLayoutComplete?: () => void;
  onItemMount?: (index: number, element: HTMLElement) => void;
  onItemUnmount?: (index: number) => void;
  onItemEnterViewport?: (index: number, visibility: ItemVisibility) => void;
  onItemLeaveViewport?: (index: number, visibility: ItemVisibility) => void;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  onResize?: (width: number, height: number) => void;
  onReachBottom?: (distance: number) => void;
  onItemClick?: (index: number, item: T, event: React.MouseEvent) => void;

  // ---- 扩展 ----
  /** 插件覆盖层等（由 composeSlots 组装，渲染在滚动容器内部） */
  children?: React.ReactNode;
  /** HOC 注入：插件拿容器 DOM 用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
  /** HOC 注入：插件拿项 DOM 用 */
  itemRefsExternal?: React.MutableRefObject<Map<number, HTMLElement>>;
  debug?: boolean;
}

// ============ Ref ============

export interface WaterfallCoreRef {
  relayout: () => void;
  scrollToItem: (index: number, options?: ScrollToItemOptions) => void;
  scrollToTop: (options?: ScrollToOptions) => void;
  scrollToBottom: (options?: ScrollToOptions) => void;
  getItemPosition: (index: number) => ItemPosition | null;
  getAllItemPositions: () => Map<number, ItemPosition>;
  getColumnHeights: () => number[];
  getLayoutInfo: () => LayoutInfo;
  getViewportInfo: () => ViewportInfo;
  /** 当前渲染出来的索引区间（虚拟化关闭时是 0..n-1） */
  getVisibleRange: () => { start: number; end: number };
  /** 当前与视口有重叠的索引集合（滚动时维护，供插件上下文使用） */
  getVisibleItems: () => Set<number>;
  forceUpdate: () => void;
  getContainer: () => HTMLDivElement | null;
  getItemElement: (index: number) => HTMLElement | null;
  measureItem: (index: number) => Promise<{ width: number; height: number }>;
}

export interface ScrollToItemOptions {
  behavior?: "auto" | "smooth";
  block?: "start" | "center" | "end" | "nearest";
  inline?: "start" | "center" | "end" | "nearest";
  offset?: number;
}

export interface ScrollToOptions {
  behavior?: "auto" | "smooth";
  offset?: number;
}

function normalizeVirtualize(
  value: boolean | VirtualizeOptions | undefined
): VirtualizeOptions | null {
  if (!value) return null;
  const options = value === true ? {} : value;
  return {
    overscan: options.overscan ?? 1,
    estimateHeight: options.estimateHeight ?? 240,
    dynamicHeights: options.dynamicHeights ?? true,
    adaptiveEstimate: options.adaptiveEstimate ?? true,
    estimateQuantile: options.estimateQuantile ?? 0.5,
  };
}

function toVisibility(
  index: number,
  position: ItemPosition,
  scrollTop: number,
  clientHeight: number
): ItemVisibility {
  const itemTop = position.y;
  const itemBottom = position.y + position.height;
  const viewportBottom = scrollTop + clientHeight;
  const overlap = Math.max(
    0,
    Math.min(viewportBottom, itemBottom) - Math.max(scrollTop, itemTop)
  );
  return {
    index,
    isVisible: overlap > 0,
    visibleRatio: position.height > 0 ? Math.min(1, overlap / position.height) : 0,
    isAboveViewport: itemBottom <= scrollTop,
    isBelowViewport: itemTop >= viewportBottom,
  };
}

// ============ 项单元 ============

interface WaterfallItemProps<T> {
  index: number;
  item: T;
  position: ItemPosition | undefined;
  useTransform: boolean;
  itemStyle?: React.CSSProperties;
  itemClassName?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  onClick?: (index: number, item: T, event: React.MouseEvent) => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

/**
 * 项单元（memo）。
 *
 * 滚动/视口更新会让 Core 重渲染，但项自身的位置与内容通常没变；没有 memo 时每一帧
 * 都要把所有 `renderItem` 重跑一遍（项内容越多越贵，P2-11）。前提是传入的引用稳定：
 * `position` 来自布局 Map、`item` 来自 items 数组、`itemRef` 按 index 缓存在
 * `itemRefCallbacksRef` 里（见 `getItemRefCallback`）。
 */
function WaterfallItemContent<T>({
  index,
  item,
  position,
  useTransform,
  itemStyle,
  itemClassName,
  renderItem,
  onClick,
  itemRef,
}: WaterfallItemProps<T>) {
  const style: React.CSSProperties = position
    ? useTransform
      ? {
          position: "absolute",
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: position.width,
          boxSizing: "border-box",
        }
      : {
          position: "absolute",
          left: position.x,
          top: position.y,
          width: position.width,
          boxSizing: "border-box",
        }
    : { position: "absolute", opacity: 0, pointerEvents: "none" };

  return (
    <div
      ref={itemRef}
      style={{ ...style, ...itemStyle }}
      className={itemClassName}
      onClick={onClick ? (event) => onClick(index, item, event) : undefined}
      data-index={index}
      data-column={position?.column}
    >
      {renderItem(item, index)}
    </div>
  );
}

/**
 * React.memo 不保留泛型签名（会退化成 unknown/any），用 typeof 把泛型还给使用处；
 * 运行时仍是普通 memo 组件，不额外包一层。
 */
const WaterfallItem = React.memo(WaterfallItemContent) as typeof WaterfallItemContent;

// ============ 组件 ============

const WaterfallCore = forwardRef<WaterfallCoreRef, WaterfallCoreProps>(
  function WaterfallCore<T = unknown>(
    props: WaterfallCoreProps<T>,
    ref: React.ForwardedRef<WaterfallCoreRef>
  ) {
    const {
      items = [],
      renderItem,
      keyExtractor = (_item, index) => index,
      columns = 3,
      gap = 16,
      rowGap,
      columnGap,
      alignmentMode = "shortest",
      padding = 0,
      containerStyle,
      containerClassName,
      itemStyle,
      itemClassName,
      useTransform = true,
      throttleDelay = 16,
      debounceDelay = 150,
      reachBottomOffset = 100,
      minItemHeight = 48,
      scrollAnchor = true,
      virtualize,
      layoutHooks,
      onMount,
      onUnmount,
      onBeforeLayout,
      onLayout,
      onLayoutComplete,
      onItemMount,
      onItemUnmount,
      onItemEnterViewport,
      onItemLeaveViewport,
      onScroll,
      onResize,
      onReachBottom,
      onItemClick,
      children,
      containerRefExternal,
      itemRefsExternal,
      debug = false,
    } = props;

    // ---- refs ----
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = containerRefExternal ?? internalContainerRef;
    const internalItemRefsMap = useRef<Map<number, HTMLElement>>(new Map());
    const itemRefsMap = itemRefsExternal ?? internalItemRefsMap;
    /**
     * 已测到的真实高度：**按稳定 key（`keyExtractor` 的结果）存**，不按 index。
     *
     * 按 index 存的旧实现在数据集替换后（Filter / Sort / Search / Pagination）会把
     * 旧项的高度套到新项上：虚拟化下离屏项没有 DOM，只能命中缓存 → 位置与总高按
     * 错误高度算，滚动到这些项时每个挂载都触发一次补排，画面连续抖动。
     */
    const measuredHeightsRef = useRef<Map<string, number>>(new Map());
    const itemResizeObserversRef = useRef<Map<number, ResizeObserver>>(new Map());
    const containerObserverRef = useRef<ResizeObserver | null>(null);
    const scrollEndTimerRef = useRef<number>();
    const layoutTimerRef = useRef<number>();
    /** 一帧内合并的「立即重排」句柄（测量到漂移时用，不等防抖） */
    const layoutRafRef = useRef<number | null>(null);
    /** 视口更新的 rAF 句柄：滚动事件每个都 setState 会让宿主双重重渲染 */
    const viewportRafRef = useRef<number | null>(null);
    const lastScrollTimeRef = useRef(0);
    const isCalculatingLayoutRef = useRef(false);
    /** 当前采用的未测量项估值（自适应估值带滞回，见 calculateLayout 里的说明） */
    const estimateRef = useRef(0);
    /** 布局在跑时被挡下的请求：结束时补跑一次，不静默丢弃 */
    const pendingRelayoutRef = useRef(false);
    /** 正在跑的那次布局用的参数签名（判重：同参数不必补跑） */
    const activeSigRef = useRef("");
    const activeHooksRef = useRef<LayoutHooks | undefined>(undefined);
    /** 始终指向最新 `calculateLayout`，供长生命周期回调使用（见下方赋值处的说明） */
    const calculateLayoutRef = useRef<() => Promise<void>>(async () => {});
    const hasInitialLayoutRef = useRef(false);
    const hasRequestedLayoutRef = useRef(false);
    const visibleItemsRef = useRef<Set<number>>(new Set());
    const itemsRef = useRef<T[]>(items);
    itemsRef.current = items;
    const positionsRef = useRef<Map<number, ItemPosition>>(new Map());
    /** 数据集指纹：文本内容不变时即便数组引用换了也不重排（P1-3） */
    const datasetSigRef = useRef<string | null>(null);
    /** 布局结束后待补偿的 scrollTop 增量（等 DOM 高度提交后再写，避免被旧 scrollHeight 钳住） */
    const pendingScrollAdjustRef = useRef(0);
    const keyExtractorRef = useRef(keyExtractor);
    keyExtractorRef.current = keyExtractor;
    const onReachBottomRef = useRef(onReachBottom);
    onReachBottomRef.current = onReachBottom;

    // ---- 派生参数 ----
    const rowGapValue = rowGap ?? gap;
    const columnGapValue = columnGap ?? gap;
    // 只认 4 个原始数值：内联 `padding={{ top: 8 }}` 每次父渲染都是新对象，
    // 以对象身份做依赖会让「没有布局参数变化」的父渲染也触发一次全量布局（P2-11）
    const paddingTop = typeof padding === "number" ? padding : (padding?.top ?? 0);
    const paddingRight = typeof padding === "number" ? padding : (padding?.right ?? 0);
    const paddingBottom = typeof padding === "number" ? padding : (padding?.bottom ?? 0);
    const paddingLeft = typeof padding === "number" ? padding : (padding?.left ?? 0);
    const paddingValues = useMemo(
      () => ({ top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft }),
      [paddingTop, paddingRight, paddingBottom, paddingLeft]
    );
    /** 项的稳定身份（与渲染 key 一致）：测量缓存 / 数据集指纹都用它 */
    const itemKeyAt = useCallback((index: number): string => {
      const item = itemsRef.current[index];
      if (item === undefined) return `#${index}`;
      try {
        return String(keyExtractorRef.current(item, index));
      } catch {
        return `#${index}`;
      }
    }, []);
    const datasetSignature = useCallback((): string => {
      const list = itemsRef.current;
      let sig = String(list.length);
      for (let i = 0; i < list.length; i++) sig += `|${itemKeyAt(i)}`;
      return sig;
    }, [itemKeyAt]);
    // 稳定化：避免每次 render 新建对象，导致下游 useMemo/ref 回调全部失效
    const virtualizeKey = JSON.stringify(virtualize ?? null);
    const virtual = useMemo(
      () => normalizeVirtualize(JSON.parse(virtualizeKey) ?? undefined),
      [virtualizeKey]
    );
    // 布局只读取这三个估值字段：拆成原始值后依赖表可以精确到字段，
    // 避免 overscan 等与布局无关的配置变化导致 calculateLayout 换身份（ctx.refs 抖动）
    const virtualAdaptiveEstimate = virtual?.adaptiveEstimate;
    const virtualEstimateHeight = virtual?.estimateHeight;
    const virtualEstimateQuantile = virtual?.estimateQuantile;
    const isVirtual = virtual !== null;

    // ---- state ----
    const [layoutInfo, setLayoutInfo] = useState<LayoutInfo>(() => ({
      columns,
      columnWidth: 0,
      gap: columnGapValue,
      columnHeights: Array(columns).fill(0),
      totalHeight: 0,
      containerWidth: 0,
      containerHeight: 0,
    }));
    const [itemPositions, setItemPositions] = useState<Map<number, ItemPosition>>(
      () => new Map()
    );
    const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
      scrollTop: 0,
      scrollLeft: 0,
      scrollHeight: 0,
      scrollWidth: 0,
      clientHeight: 0,
      clientWidth: 0,
      isScrolling: false,
      direction: null,
    });
    const [, forceUpdateState] = useState({});
    positionsRef.current = itemPositions;
    /**
     * `layoutInfo` 的镜像：只在 calculateLayout 里写。
     * 不跟着 render 同步 —— 它要表达的是「最近一次算完的布局」，
     * 插件在 onLayoutComplete 里读的必须是刚算出来那份，而不是上一帧的 state。
     */
    const layoutInfoRef = useRef<LayoutInfo>(layoutInfo);

    /**
     * 布局前的滚动锚点：取「首个可见项」的索引与它在视口内的偏移。
     * 布局后按新位置反算 scrollTop，让这一项留在原来的屏幕位置（P1-5）。
     * `scrollTop <= 0` 时不锚定 —— 顶部本来就没有上方内容可补偿。
     */
    const captureScrollAnchor = useCallback(
      (container: HTMLDivElement): { index: number; offset: number } | null => {
        const positions = positionsRef.current;
        if (positions.size === 0) return null;
        const scrollTop = container.scrollTop;
        if (scrollTop <= 0) return null;

        let nextIndex = -1;
        let nextTop = Number.POSITIVE_INFINITY;
        let coveringIndex = -1;
        let coveringTop = Number.NEGATIVE_INFINITY;
        positions.forEach((position, index) => {
          if (position.y >= scrollTop && position.y < nextTop) {
            nextTop = position.y;
            nextIndex = index;
          }
          if (
            position.y <= scrollTop &&
            position.y + position.height > scrollTop &&
            position.y > coveringTop
          ) {
            coveringTop = position.y;
            coveringIndex = index;
          }
        });

        const anchorIndex = nextIndex >= 0 ? nextIndex : coveringIndex;
        const anchorPosition = positions.get(anchorIndex);
        if (!anchorPosition) return null;
        return { index: anchorIndex, offset: anchorPosition.y - scrollTop };
      },
      []
    );

    /** 上次已触发触底的滚动状态指纹：同一状态不重复回调（避免布局/尺寸抖动造成连环触发） */
    const lastReachSignatureRef = useRef("");
    const reachBottomTimerRef = useRef<number | null>(null);

    /**
     * 触底判定（从 `handleScroll` 里抽出来）。
     *
     * 旧实现只在 scroll 事件里判断：首屏内容不足一屏时容器没有可滚动范围 →
     * 不产生 scroll → `onLoadMore` 一次都不会调，无限滚动永远停在第一页（P1-4）。
     */
    const maybeReachBottom = useCallback(() => {
      const handler = onReachBottomRef.current;
      if (!handler) return;
      const container = containerRef.current;
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distance = scrollHeight - (scrollTop + clientHeight);
      if (distance >= reachBottomOffset) return;
      const signature = `${scrollTop}|${scrollHeight}|${clientHeight}`;
      if (signature === lastReachSignatureRef.current) return;
      lastReachSignatureRef.current = signature;
      handler(distance);
    }, [containerRef, reachBottomOffset]);

    /** 布局/resize/items 变化后补一次触底检查：等 DOM 高度提交后再量（否则读到旧 scrollHeight） */
    const scheduleReachBottomCheck = useCallback(() => {
      if (reachBottomTimerRef.current != null) return;
      reachBottomTimerRef.current = window.setTimeout(() => {
        reachBottomTimerRef.current = null;
        maybeReachBottom();
      }, 0);
    }, [maybeReachBottom]);

    // ---- 布局 ----
    const calculateLayout = useCallback(async () => {
      const container = containerRef.current;
      if (!container) return;
      // 已有布局在跑：不能直接丢（丢了这一帧就永远停在旧列数上），置脏等它收尾再补一次。
      // 但如果这次请求的布局参数和正在跑的那一次完全一样，补跑没有意义 ——
      // 挂载时「挂载 effect + items effect」本来就会各来一次，补跑只会让
      // onLayoutComplete 多触发一遍（埋点类插件会重复上报）。
      const sig = `${columns}|${columnGapValue}|${rowGapValue}|${paddingValues.top},${paddingValues.right},${paddingValues.bottom},${paddingValues.left}|${alignmentMode}|${virtualEstimateHeight ?? ""}|${virtualAdaptiveEstimate ?? ""}|${virtualEstimateQuantile ?? ""}`;
      if (isCalculatingLayoutRef.current) {
        if (sig !== activeSigRef.current || layoutHooks !== activeHooksRef.current) {
          pendingRelayoutRef.current = true;
        }
        return;
      }

      isCalculatingLayoutRef.current = true;
      activeSigRef.current = sig;
      activeHooksRef.current = layoutHooks;
      hasRequestedLayoutRef.current = false;

      // 滚动锚定：布局前记下「首个可见项」及其视口内偏移（P1-5）
      const anchor = captureScrollAnchor(container);

      try {
        const beforeResult = await onBeforeLayout?.();
        if (beforeResult === false) return;

        if (debug) console.time("[WaterfallCore] layout");
        onLayout?.();

        const containerWidth = container.clientWidth;
        const heights = itemsRef.current.map((_item, index) => {
          const el = itemRefsMap.current.get(index);
          const live = el?.offsetHeight ?? 0;
          if (live > 0) {
            measuredHeightsRef.current.set(itemKeyAt(index), live);
            return live;
          }
          return measuredHeightsRef.current.get(itemKeyAt(index)) ?? 0;
        });

        // 未测量项的估值：默认跟随实测样本（见 virtualize.ts 的说明）。
        // 用中位数而不是高分位，是因为总高 = 所有项高度之和，中位数让总高误差最小；
        // 重叠由「量到真高就立刻重排」兜住（误差只存在一帧，且多数落在视口外），
        // 而不是靠把估值整体抬高 —— 抬高只是把误差从「重叠」换成「滚动条虚长」。
        let estimate: number | undefined;
        if (isVirtual) {
          if (virtualAdaptiveEstimate === false) {
            estimate = virtualEstimateHeight;
          } else {
            const raw = resolveEstimateHeight(
              measuredHeightsRef.current.values(),
              virtualEstimateHeight ?? 240,
              virtualEstimateQuantile
            );
            // 滞回：样本每多一项就换一次估值会让画面持续微抖，差 8px 以内不更新
            if (Math.abs(raw - estimateRef.current) > 8) estimateRef.current = raw;
            estimate = estimateRef.current || raw;
          }
        }

        const result = computeLayout({
          heights,
          columns,
          containerWidth,
          columnGap: columnGapValue,
          rowGap: rowGapValue,
          padding: paddingValues,
          alignmentMode,
          estimateHeight: estimate,
          minItemHeight,
          hooks: layoutHooks,
        });

        const nextInfo: LayoutInfo = {
          columns: result.columns,
          columnWidth: result.columnWidth,
          gap: columnGapValue,
          columnHeights: result.columnHeights,
          totalHeight: result.totalHeight,
          containerWidth,
          containerHeight: container.clientHeight,
        };
        // 先写镜像再 setState：onLayoutComplete 里插件读的是 ref 镜像，
        // 而 setState 要等下一次提交才生效 —— 只写 state 的话，补跑那一轮
        // 插件读到的是上一帧的位置（曾经表现为 ctx.getItemPosition(0) === undefined）
        layoutInfoRef.current = nextInfo;
        positionsRef.current = result.positions;
        setLayoutInfo(nextInfo);
        setItemPositions(result.positions);
        hasInitialLayoutRef.current = true;

        if (debug) {
          console.timeEnd("[WaterfallCore] layout");
          if (result.estimatedCount > 0) {
            console.debug(
              `[WaterfallCore] ${result.estimatedCount} 项按估值占位（estimateHeight=${estimate}）`
            );
          }
        }

        // 布局结果已写入 ref 镜像与 state，通知插件。
        // 这个调用包在 try/finally 内：插件回调抛错也不会让布局标志卡死（P1-1）
        onLayoutComplete?.();

        // 视口上方的项变高/变矮时，补偿 scrollTop，让首个可见项留在原位。
        // 补偿量在提交后由 layout effect 写入（此刻 scrollHeight 还是旧值，会被钳住）
        if (anchor && scrollAnchor) {
          const nextPosition = result.positions.get(anchor.index);
          if (nextPosition) {
            const delta = nextPosition.y - anchor.offset - container.scrollTop;
            if (Math.abs(delta) >= 1) pendingScrollAdjustRef.current += delta;
          }
        }

        // 触底判定不再只依赖 scroll：首屏内容不足一屏时根本不会产生 scroll 事件（P1-4）
        scheduleReachBottomCheck();
      } catch (error) {
        // 消费方回调（onBeforeLayout / onLayout / onLayoutComplete 等）抛错时
        // 绝不能把标志卡在 true —— 旧实现会让后续所有布局在早退处被拦掉，永久冻结（P1-1）
        console.warn("[vane-waterfall] 布局过程出错，本次布局已跳过", error);
      } finally {
        isCalculatingLayoutRef.current = false;
        // 布局期间被丢弃的请求在这里补一次：用 ref 取最新闭包，
        // 否则补的那次会带着触发时的旧 props（典型后果：列数改了又被排回去）
        if (pendingRelayoutRef.current) {
          pendingRelayoutRef.current = false;
          void calculateLayoutRef.current();
        }
      }
    }, [
      columns,
      columnGapValue,
      rowGapValue,
      paddingValues,
      alignmentMode,
      isVirtual,
      virtualAdaptiveEstimate,
      virtualEstimateHeight,
      virtualEstimateQuantile,
      layoutHooks,
      onBeforeLayout,
      onLayout,
      onLayoutComplete,
      debug,
      minItemHeight,
      scrollAnchor,
      containerRef,
      itemRefsMap,
      itemKeyAt,
      captureScrollAnchor,
      scheduleReachBottomCheck,
    ]);

    // 布局结束后把待补偿的 scrollTop 写进去：此时 DOM 高度已按新 totalHeight 提交，
    // 不会被旧 scrollHeight 钳住（写在 setState 之前会读旧值）
    useLayoutEffect(() => {
      const delta = pendingScrollAdjustRef.current;
      if (!delta) return;
      pendingScrollAdjustRef.current = 0;
      const container = containerRef.current;
      if (container) container.scrollTop += delta;
    });

    // 长生命周期回调（容器的 ResizeObserver、每项的 ResizeObserver、防抖定时器）都在挂载时
    // 建好、之后不再重建，它们捕获的 `calculateLayout` 会一直是**首帧**那份。列数 / 间距是
    // props，首帧闭包里的值永远是旧值 —— 表现就是「拖了列数，排一下又弹回去」。
    // 所以这类回调一律走 ref，永远取最新实现的闭包。
    calculateLayoutRef.current = calculateLayout;

    const throttledCalculateLayout = useCallback(() => {
      if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
      layoutTimerRef.current = window.setTimeout(() => {
        void calculateLayoutRef.current();
      }, debounceDelay);
      // 身份刻意稳定（不依赖 calculateLayout）：它被 items effect、ResizeObserver、
      // 项 ref 回调长期持有，跟着 props 一起变会让那些 effect 反复重跑。
    }, [debounceDelay]);

    /**
     * 立刻重排，但一帧内只排一次。
     *
     * 用于「项挂载后量到的高度与位置对不上」——这种场景等 `debounceDelay` 再排的话，
     * 那几十到一百多毫秒里该列后面的项就压在它身上（滚动中最刺眼的就是这个）。
     * 容器 resize 那种连续输入仍走上面的防抖，避免布局风暴。
     */
    const scheduleLayoutNow = useCallback(() => {
      if (layoutRafRef.current != null) return;
      layoutRafRef.current = requestAnimationFrame(() => {
        layoutRafRef.current = null;
        void calculateLayoutRef.current();
      });
    }, []);

    // ---- 视口 ----
    // 滚动事件每个都 setState 会让宿主双重重渲染（Core + HOC）。合并到一帧一次，
    // 虚拟化窗口最多少更新一帧，换掉的是滚动期每个事件两次 render（P2-11）
    const updateViewportInfo = useCallback((isScrolling: boolean) => {
      if (viewportRafRef.current != null) return;
      viewportRafRef.current = requestAnimationFrame(() => {
        viewportRafRef.current = null;
        const container = containerRef.current;
        if (!container) return;
        setViewportInfo((prev) => {
          const scrollTop = container.scrollTop;
          const scrollLeft = container.scrollLeft;
          const direction: ViewportInfo["direction"] =
            scrollTop > prev.scrollTop
              ? "down"
              : scrollTop < prev.scrollTop
                ? "up"
                : scrollLeft > prev.scrollLeft
                  ? "right"
                  : scrollLeft < prev.scrollLeft
                    ? "left"
                    : prev.direction;
          const next = {
            scrollTop,
            scrollLeft,
            scrollHeight: container.scrollHeight,
            scrollWidth: container.scrollWidth,
            clientHeight: container.clientHeight,
            clientWidth: container.clientWidth,
            isScrolling,
            direction,
          };
          // 值没变就不触发重渲染（滚动很小或 rAF 合并后位置未变时常见）
          if (
            prev.scrollTop === next.scrollTop &&
            prev.scrollLeft === next.scrollLeft &&
            prev.scrollHeight === next.scrollHeight &&
            prev.clientHeight === next.clientHeight &&
            prev.isScrolling === next.isScrolling
          ) {
            return prev;
          }
          return next;
        });
      });
    }, [containerRef]);

    // ---- 滚动 ----
    const handleScroll = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const now = Date.now();
      updateViewportInfo(true);

      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      onScroll?.(scrollTop, container.scrollLeft);

      if (now - lastScrollTimeRef.current >= throttleDelay) {
        lastScrollTimeRef.current = now;

        maybeReachBottom();

        if (onItemEnterViewport || onItemLeaveViewport) {
          const positions = positionsRef.current;
          const newVisible = new Set<number>();
          positions.forEach((position, index) => {
            const overlap = Math.max(
              0,
              Math.min(scrollTop + clientHeight, position.y + position.height) -
                Math.max(scrollTop, position.y)
            );
            if (overlap > 0) {
              newVisible.add(index);
              if (!visibleItemsRef.current.has(index)) {
                onItemEnterViewport?.(
                  index,
                  toVisibility(index, position, scrollTop, clientHeight)
                );
              }
            }
          });
          visibleItemsRef.current.forEach((index) => {
            if (newVisible.has(index)) return;
            const position = positions.get(index);
            if (position) {
              onItemLeaveViewport?.(
                index,
                toVisibility(index, position, scrollTop, clientHeight)
              );
            }
          });
          visibleItemsRef.current = newVisible;
        }
      }

      if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = window.setTimeout(() => {
        setViewportInfo((prev) => ({ ...prev, isScrolling: false }));
      }, debounceDelay);
    }, [
      updateViewportInfo,
      onScroll,
      onItemEnterViewport,
      onItemLeaveViewport,
      throttleDelay,
      debounceDelay,
      maybeReachBottom,
      containerRef,
    ]);

    // ---- 尺寸变化 ----
    const handleResize = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      onResize?.(container.clientWidth, container.clientHeight);
      throttledCalculateLayout();
    }, [onResize, throttledCalculateLayout, containerRef]);

    // ---- 挂载 / 卸载 ----
    useEffect(() => {
      onMount?.();
      if (!hasInitialLayoutRef.current) void calculateLayout();

      const container = containerRef.current;
      if (container && typeof ResizeObserver !== "undefined") {
        containerObserverRef.current = new ResizeObserver(handleResize);
        containerObserverRef.current.observe(container);
      }

      // 项级 observer 集合的 Map 身份在组件生命周期内不变（useRef 初始化一次），
      // 挂载时取一次引用即可；cleanup 时用它断干净，不依赖 React 的 null ref 回调时序。
      const itemObservers = itemResizeObserversRef.current;

      return () => {
        onUnmount?.();
        containerObserverRef.current?.disconnect();
        containerObserverRef.current = null;
        itemObservers.forEach((ro) => {
          try {
            ro.disconnect();
          } catch {
            /* noop */
          }
        });
        itemObservers.clear();
        if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
        if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
        if (reachBottomTimerRef.current != null) {
          window.clearTimeout(reachBottomTimerRef.current);
          reachBottomTimerRef.current = null;
        }
        if (viewportRafRef.current != null) {
          cancelAnimationFrame(viewportRafRef.current);
          viewportRafRef.current = null;
        }
        if (layoutRafRef.current != null) {
          cancelAnimationFrame(layoutRafRef.current);
          layoutRafRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * 已经为「这个高度」补过一次重排的项。
     *
     * 用途是防止来回震荡：插件可以通过 calculateItemPosition 把项高度改写成自己的值
     * （FixedHeight 之类），此时 DOM 高度和 position.height 会长期不一致，
     * 若每次量到都重排就会无限循环。按 index 记住补过的实测高度，同一个高度只补一次。
     */
    const heightRepairRef = useRef(new Map<number, number>());

    // items 变化 → 重新布局。
    // 先算数据集指纹：数组引用变了但内容（长度 + 每项 key）没变时不必重排（P1-3）
    useEffect(() => {
      const signature = datasetSignature();
      if (signature === datasetSigRef.current) return;
      datasetSigRef.current = signature;

      hasInitialLayoutRef.current = false;
      hasRequestedLayoutRef.current = false;
      // 换了数据集，之前为「某个高度补过一次」的记录就失效了（index 含义变了）
      heightRepairRef.current.clear();

      // 测量缓存按稳定 key 保留「仍然存在」的项，其余丢弃（P1-2）。
      // 旧实现按 index 存且从不清理 → 排序/筛选后离屏项沿用旧项高度。
      const alive = new Set<string>();
      for (let i = 0; i < itemsRef.current.length; i++) alive.add(itemKeyAt(i));
      let kept = 0;
      measuredHeightsRef.current.forEach((_height, key) => {
        if (alive.has(key)) kept += 1;
        else measuredHeightsRef.current.delete(key);
      });
      // 新旧数据集完全没有重叠 → 旧估值样本不再可信，重置（避免新数据沿用旧中位数）
      if (kept === 0) estimateRef.current = 0;

      throttledCalculateLayout();
    }, [items, throttledCalculateLayout, datasetSignature, itemKeyAt]);

    // 布局参数变化 → 立即重排（等防抖会让画面明显跳一下）
    // 这里的依赖表就是「一切影响布局结果的入参」：漏一个就会表现为该 prop 改了没反应
    useEffect(() => {
      hasInitialLayoutRef.current = false;
      hasRequestedLayoutRef.current = false;
      void calculateLayout();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      columns,
      columnGapValue,
      rowGapValue,
      paddingValues,
      alignmentMode,
      virtual?.estimateHeight,
      virtual?.adaptiveEstimate,
      virtual?.estimateQuantile,
      layoutHooks,
    ]);

    // ---- 项的 ref 回调：按 index 缓存成稳定函数 ----
    const itemRefHandlerRef = useRef<(index: number, el: HTMLDivElement | null) => void>(
      () => {}
    );
    itemRefHandlerRef.current = (index, el) => {
      if (el) {
        itemRefsMap.current.set(index, el);
        const key = itemKeyAt(index);
        const height = el.offsetHeight;
        if (height > 0) measuredHeightsRef.current.set(key, height);

        const dynamic = virtual ? virtual.dynamicHeights !== false : true;
        if (dynamic && !itemResizeObserversRef.current.has(index)) {
          if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => {
              const h = el.offsetHeight;
              if (h <= 0) return;
              measuredHeightsRef.current.set(itemKeyAt(index), h);

              // 光看「测量值变了」不够：ref 回调已经把高度写进 measuredHeights 了，
              // 这里再比就永远是 false。真正要问的是「当前这份位置，是按这个高度算的吗」——
              // 虚拟化下项先按 estimateHeight 落位、挂上来才量到真高，位置高度必然对不上，
              // 此时若不重排，同一列就会按估值高度紧紧码着，实测高度更大的项相互重叠。
              const pos = positionsRef.current.get(index);
              const drifted = pos ? Math.abs(pos.height - h) > 0.5 : false;
              const repaired = heightRepairRef.current.get(index) === h;

              if (!pos) {
                // 这一项还没有位置（首屏并发挂载时常见）→ 必须补一次布局
                scheduleLayoutNow();
              } else if (drifted && !repaired) {
                heightRepairRef.current.set(index, h);
                scheduleLayoutNow();
              }
            });
            try {
              ro.observe(el);
              itemResizeObserversRef.current.set(index, ro);
            } catch {
              /* noop */
            }
          }
        }

        onItemMount?.(index, el);

        // 首帧：项已挂上但还没有位置 → 立刻补一次布局
        if (
          hasInitialLayoutRef.current &&
          !positionsRef.current.has(index) &&
          !isCalculatingLayoutRef.current &&
          !hasRequestedLayoutRef.current
        ) {
          hasRequestedLayoutRef.current = true;
          requestAnimationFrame(() => void calculateLayout());
        }
      } else {
        itemRefsMap.current.delete(index);
        // 回调缓存也要跟着回收：旧实现只增不删，长列表滚久了 Map 无上限增长（P2-10）
        itemRefCallbacksRef.current.delete(index);
        const ro = itemResizeObserversRef.current.get(index);
        if (ro) {
          try {
            ro.disconnect();
          } catch {
            /* noop */
          }
          itemResizeObserversRef.current.delete(index);
        }
        onItemUnmount?.(index);
      }
    };

    const itemRefCallbacksRef = useRef(
      new Map<number, (el: HTMLDivElement | null) => void>()
    );
    const getItemRefCallback = (index: number) => {
      let cb = itemRefCallbacksRef.current.get(index);
      if (!cb) {
        cb = (el: HTMLDivElement | null) => itemRefHandlerRef.current(index, el);
        itemRefCallbacksRef.current.set(index, cb);
      }
      return cb;
    };

    // ---- 虚拟化范围 ----
    const visibleRange = useMemo(
      () =>
        virtual
          ? computeVisibleRange(
              itemPositions,
              items.length,
              viewportInfo.scrollTop,
              viewportInfo.clientHeight || layoutInfo.containerHeight || 600,
              virtual.overscan
            )
          : { start: 0, end: Math.max(0, items.length - 1), hiddenCount: 0 },
      [
        virtual,
        itemPositions,
        items.length,
        viewportInfo.scrollTop,
        viewportInfo.clientHeight,
        layoutInfo.containerHeight,
      ]
    );

    // ---- ref 契约 ----
    useImperativeHandle(
      ref,
      () => ({
        relayout: () => {
          // 测量缓存与估值样本一起清：只清前者会让新的实测值继续被旧中位数拉偏
          measuredHeightsRef.current.clear();
          estimateRef.current = 0;
          itemsRef.current.forEach((_item, index) => {
            const el = itemRefsMap.current.get(index);
            if (!el) return;
            const height = el.offsetHeight;
            if (height > 0) measuredHeightsRef.current.set(itemKeyAt(index), height);
          });
          void calculateLayout();
        },
        scrollToItem: (index, options = {}) => {
          const container = containerRef.current;
          const position = positionsRef.current.get(index);
          if (!container || !position) return;
          container.scrollTo({
            top: computeScrollTopForItem(
              position,
              container.clientHeight,
              options.block ?? "start",
              options.offset ?? 0
            ),
            behavior: options.behavior ?? "auto",
          });
        },
        scrollToTop: (options = {}) => {
          containerRef.current?.scrollTo({
            top: options.offset ?? 0,
            behavior: options.behavior ?? "auto",
          });
        },
        scrollToBottom: (options = {}) => {
          const container = containerRef.current;
          if (!container) return;
          container.scrollTo({
            top: container.scrollHeight - container.clientHeight + (options.offset ?? 0),
            behavior: options.behavior ?? "auto",
          });
        },
        getItemPosition: (index) => positionsRef.current.get(index) ?? null,
        getAllItemPositions: () => positionsRef.current,
        getColumnHeights: () => layoutInfoRef.current.columnHeights,
        getLayoutInfo: () => layoutInfoRef.current,
        getViewportInfo: () => {
          const container = containerRef.current;
          if (!container) return viewportInfo;
          return {
            scrollTop: container.scrollTop,
            scrollLeft: container.scrollLeft,
            scrollHeight: container.scrollHeight,
            scrollWidth: container.scrollWidth,
            clientHeight: container.clientHeight,
            clientWidth: container.clientWidth,
            isScrolling: viewportInfo.isScrolling,
            direction: viewportInfo.direction,
          };
        },
        getVisibleRange: () => ({ start: visibleRange.start, end: visibleRange.end }),
        getVisibleItems: () => new Set(visibleItemsRef.current),
        forceUpdate: () => forceUpdateState({}),
        getContainer: () => containerRef.current,
        getItemElement: (index) => itemRefsMap.current.get(index) ?? null,
        measureItem: async (index) => {
          const element = itemRefsMap.current.get(index);
          const key = itemKeyAt(index);
          if (element) {
            const size = { width: element.offsetWidth, height: element.offsetHeight };
            if (size.height > 0) measuredHeightsRef.current.set(key, size.height);
            return size;
          }
          const cached = measuredHeightsRef.current.get(key);
          if (cached) return { width: layoutInfo.columnWidth, height: cached };
          return { width: layoutInfo.columnWidth, height: virtual?.estimateHeight ?? 0 };
        },
      }),
      [
        calculateLayout,
        layoutInfo,
        viewportInfo,
        visibleRange,
        containerRef,
        itemRefsMap,
        virtual?.estimateHeight,
        itemKeyAt,
      ]
    );

    // ---- 渲染 ----
    const renderedIndexes = useMemo(() => {
      if (!virtual) return items.map((_item, index) => index);
      const indexes: number[] = [];
      for (let i = visibleRange.start; i <= visibleRange.end; i++) indexes.push(i);
      return indexes;
    }, [virtual, items, visibleRange.start, visibleRange.end]);

    return (
      <div
        ref={containerRef as React.Ref<HTMLDivElement>}
        style={{
          position: "relative",
          overflowX: "hidden",
          overflowY: "auto",
          ...containerStyle,
        }}
        className={containerClassName}
        onScroll={handleScroll}
        data-vane-waterfall=""
      >
        {children}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: layoutInfo.totalHeight,
            minWidth: 0,
          }}
        >
          {renderedIndexes.map((index) => {
            const item = items[index];
            if (item === undefined) return null;
            return (
              <WaterfallItem
                key={keyExtractor(item, index)}
                index={index}
                item={item}
                position={itemPositions.get(index)}
                useTransform={useTransform}
                itemStyle={itemStyle}
                itemClassName={itemClassName}
                renderItem={renderItem}
                onClick={onItemClick}
                itemRef={getItemRefCallback(index)}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

export default WaterfallCore;
