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
 * 相对旧实现（archive-plugins/vane-waterfall）的改动：
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
  normalizePadding,
  type AlignmentMode,
  type LayoutHooks,
} from "./layout";
import { computeVisibleRange, type VirtualizeOptions } from "./virtualize";

// ============ Props ============

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
  if (value === true) {
    return { overscan: 1, estimateHeight: 240, dynamicHeights: true };
  }
  return {
    overscan: value.overscan ?? 1,
    estimateHeight: value.estimateHeight ?? 240,
    dynamicHeights: value.dynamicHeights ?? true,
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

// ============ 组件 ============

const WaterfallCore = forwardRef<WaterfallCoreRef, WaterfallCoreProps>(
  function WaterfallCore<T = any>(
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
    /** 已测到的真实高度：项被虚拟化卸载后仍然记得 */
    const measuredHeightsRef = useRef<Map<number, number>>(new Map());
    const itemResizeObserversRef = useRef<Map<number, ResizeObserver>>(new Map());
    const containerObserverRef = useRef<ResizeObserver | null>(null);
    const scrollEndTimerRef = useRef<number>();
    const layoutTimerRef = useRef<number>();
    const lastScrollTimeRef = useRef(0);
    const isCalculatingLayoutRef = useRef(false);
    const hasInitialLayoutRef = useRef(false);
    const hasRequestedLayoutRef = useRef(false);
    const visibleItemsRef = useRef<Set<number>>(new Set());
    const itemsRef = useRef<T[]>(items);
    itemsRef.current = items;
    const positionsRef = useRef<Map<number, ItemPosition>>(new Map());

    // ---- 派生参数 ----
    const rowGapValue = rowGap ?? gap;
    const columnGapValue = columnGap ?? gap;
    const paddingValues = useMemo(() => normalizePadding(padding), [padding]);
    // 稳定化：避免每次 render 新建对象，导致下游 useMemo/ref 回调全部失效
    const virtualizeKey = JSON.stringify(virtualize ?? null);
    const virtual = useMemo(
      () => normalizeVirtualize(JSON.parse(virtualizeKey) ?? undefined),
      [virtualizeKey]
    );

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

    // ---- 布局 ----
    const calculateLayout = useCallback(async () => {
      const container = containerRef.current;
      if (!container) return;
      if (isCalculatingLayoutRef.current) return;

      isCalculatingLayoutRef.current = true;
      hasRequestedLayoutRef.current = false;

      const beforeResult = await onBeforeLayout?.();
      if (beforeResult === false) {
        isCalculatingLayoutRef.current = false;
        return;
      }

      if (debug) console.time("[WaterfallCore] layout");
      onLayout?.();

      const containerWidth = container.clientWidth;
      const heights = itemsRef.current.map((_item, index) => {
        const el = itemRefsMap.current.get(index);
        const live = el?.offsetHeight ?? 0;
        if (live > 0) {
          measuredHeightsRef.current.set(index, live);
          return live;
        }
        return measuredHeightsRef.current.get(index) ?? 0;
      });

      const result = computeLayout({
        heights,
        columns,
        containerWidth,
        columnGap: columnGapValue,
        rowGap: rowGapValue,
        padding: paddingValues,
        alignmentMode,
        estimateHeight: virtual?.estimateHeight,
        hooks: layoutHooks,
      });

      setLayoutInfo({
        columns: result.columns,
        columnWidth: result.columnWidth,
        gap: columnGapValue,
        columnHeights: result.columnHeights,
        totalHeight: result.totalHeight,
        containerWidth,
        containerHeight: container.clientHeight,
      });
      setItemPositions(result.positions);
      hasInitialLayoutRef.current = true;

      if (debug) {
        console.timeEnd("[WaterfallCore] layout");
        if (result.estimatedCount > 0) {
          console.debug(
            `[WaterfallCore] ${result.estimatedCount} 项按估值占位（estimateHeight=${virtual?.estimateHeight}）`
          );
        }
      }

      onLayoutComplete?.();
      isCalculatingLayoutRef.current = false;
    }, [
      columns,
      columnGapValue,
      rowGapValue,
      paddingValues,
      alignmentMode,
      virtual?.estimateHeight,
      layoutHooks,
      onBeforeLayout,
      onLayout,
      onLayoutComplete,
      debug,
      containerRef,
      itemRefsMap,
    ]);

    const throttledCalculateLayout = useCallback(() => {
      if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
      layoutTimerRef.current = window.setTimeout(() => {
        void calculateLayout();
      }, debounceDelay);
    }, [calculateLayout, debounceDelay]);

    // ---- 视口 ----
    const updateViewportInfo = useCallback((isScrolling: boolean) => {
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
        return {
          scrollTop,
          scrollLeft,
          scrollHeight: container.scrollHeight,
          scrollWidth: container.scrollWidth,
          clientHeight: container.clientHeight,
          clientWidth: container.clientWidth,
          isScrolling,
          direction,
        };
      });
    }, [containerRef]);

    // ---- 滚动 ----
    const handleScroll = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const now = Date.now();
      updateViewportInfo(true);

      const scrollTop = container.scrollTop;
      const { clientHeight, scrollHeight } = container;
      onScroll?.(scrollTop, container.scrollLeft);

      if (now - lastScrollTimeRef.current >= throttleDelay) {
        lastScrollTimeRef.current = now;

        if (onReachBottom) {
          const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
          if (distanceToBottom < reachBottomOffset) onReachBottom(distanceToBottom);
        }

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
      onReachBottom,
      onItemEnterViewport,
      onItemLeaveViewport,
      throttleDelay,
      debounceDelay,
      reachBottomOffset,
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

      return () => {
        onUnmount?.();
        containerObserverRef.current?.disconnect();
        containerObserverRef.current = null;
        // 项级 observer：旧版只靠 ref 回调传 null 来 disconnect，
        // 整树卸载时依赖 React 的调用时序，这里显式兜一层。
        itemResizeObserversRef.current.forEach((ro) => {
          try {
            ro.disconnect();
          } catch {
            /* noop */
          }
        });
        itemResizeObserversRef.current.clear();
        if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
        if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // items 变化 → 重新布局
    useEffect(() => {
      hasInitialLayoutRef.current = false;
      hasRequestedLayoutRef.current = false;
      throttledCalculateLayout();
    }, [items, throttledCalculateLayout]);

    // 列参数变化 → 立即重排（等防抖会让画面明显跳一下）
    useEffect(() => {
      hasInitialLayoutRef.current = false;
      hasRequestedLayoutRef.current = false;
      void calculateLayout();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns, columnGapValue, rowGapValue]);

    // ---- 项的 ref 回调：按 index 缓存成稳定函数 ----
    const itemRefHandlerRef = useRef<(index: number, el: HTMLDivElement | null) => void>(
      () => {}
    );
    itemRefHandlerRef.current = (index, el) => {
      if (el) {
        itemRefsMap.current.set(index, el);
        const height = el.offsetHeight;
        if (height > 0) measuredHeightsRef.current.set(index, height);

        const dynamic = virtual ? virtual.dynamicHeights !== false : true;
        if (dynamic && !itemResizeObserversRef.current.has(index)) {
          if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => {
              const h = el.offsetHeight;
              if (h <= 0) return;
              const changed = measuredHeightsRef.current.get(index) !== h;
              measuredHeightsRef.current.set(index, h);
              if (changed || !positionsRef.current.has(index)) {
                throttledCalculateLayout();
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
          measuredHeightsRef.current.clear();
          itemsRef.current.forEach((_item, index) => {
            const el = itemRefsMap.current.get(index);
            if (el) measuredHeightsRef.current.set(index, el.offsetHeight);
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
        getColumnHeights: () => layoutInfo.columnHeights,
        getLayoutInfo: () => layoutInfo,
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
        forceUpdate: () => forceUpdateState({}),
        getContainer: () => containerRef.current,
        getItemElement: (index) => itemRefsMap.current.get(index) ?? null,
        measureItem: async (index) => {
          const element = itemRefsMap.current.get(index);
          if (element) {
            const size = { width: element.offsetWidth, height: element.offsetHeight };
            if (size.height > 0) measuredHeightsRef.current.set(index, size.height);
            return size;
          }
          const cached = measuredHeightsRef.current.get(index);
          if (cached) return { width: layoutInfo.columnWidth, height: cached };
          return { width: layoutInfo.columnWidth, height: virtual?.estimateHeight ?? 0 };
        },
      }),
      [calculateLayout, layoutInfo, viewportInfo, visibleRange, containerRef, itemRefsMap, virtual?.estimateHeight]
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
            const position = itemPositions.get(index);
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
                key={keyExtractor(item, index)}
                ref={getItemRefCallback(index)}
                style={{ ...style, ...itemStyle }}
                className={itemClassName}
                onClick={(event) => onItemClick?.(index, item, event)}
                data-index={index}
                data-column={position?.column}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default WaterfallCore;
