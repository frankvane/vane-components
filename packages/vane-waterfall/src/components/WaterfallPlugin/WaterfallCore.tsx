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
    /**
     * `layoutInfo` 的镜像：只在 calculateLayout 里写。
     * 不跟着 render 同步 —— 它要表达的是「最近一次算完的布局」，
     * 插件在 onLayoutComplete 里读的必须是刚算出来那份，而不是上一帧的 state。
     */
    const layoutInfoRef = useRef<LayoutInfo>(layoutInfo);

    // ---- 布局 ----
    const calculateLayout = useCallback(async () => {
      const container = containerRef.current;
      if (!container) return;
      // 已有布局在跑：不能直接丢（丢了这一帧就永远停在旧列数上），置脏等它收尾再补一次。
      // 但如果这次请求的布局参数和正在跑的那一次完全一样，补跑没有意义 ——
      // 挂载时「挂载 effect + items effect」本来就会各来一次，补跑只会让
      // onLayoutComplete 多触发一遍（埋点类插件会重复上报）。
      const sig = `${columns}|${columnGapValue}|${rowGapValue}|${paddingValues.top},${paddingValues.right},${paddingValues.bottom},${paddingValues.left}|${alignmentMode}|${virtual?.estimateHeight ?? ""}`;
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
            `[WaterfallCore] ${result.estimatedCount} 项按估值占位（estimateHeight=${virtual?.estimateHeight}）`
          );
        }
      }

      onLayoutComplete?.();
      isCalculatingLayoutRef.current = false;

      // 布局期间被丢弃的请求在这里补一次：用 ref 取最新闭包，
      // 否则补的那次会带着触发时的旧 props（典型后果：列数改了又被排回去）
      if (pendingRelayoutRef.current) {
        pendingRelayoutRef.current = false;
        void calculateLayoutRef.current();
      }
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

    /**
     * 已经为「这个高度」补过一次重排的项。
     *
     * 用途是防止来回震荡：插件可以通过 calculateItemPosition 把项高度改写成自己的值
     * （FixedHeight 之类），此时 DOM 高度和 position.height 会长期不一致，
     * 若每次量到都重排就会无限循环。按 index 记住补过的实测高度，同一个高度只补一次。
     */
    const heightRepairRef = useRef(new Map<number, number>());

    // items 变化 → 重新布局
    useEffect(() => {
      hasInitialLayoutRef.current = false;
      hasRequestedLayoutRef.current = false;
      // 换了数据集，之前为「某个高度补过一次」的记录就失效了（index 含义变了）
      heightRepairRef.current.clear();
      throttledCalculateLayout();
    }, [items, throttledCalculateLayout]);

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
      layoutHooks,
    ]);

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
              measuredHeightsRef.current.set(index, h);

              // 光看「测量值变了」不够：ref 回调已经把高度写进 measuredHeights 了，
              // 这里再比就永远是 false。真正要问的是「当前这份位置，是按这个高度算的吗」——
              // 虚拟化下项先按 estimateHeight 落位、挂上来才量到真高，位置高度必然对不上，
              // 此时若不重排，同一列就会按估值高度紧紧码着，实测高度更大的项相互重叠。
              const pos = positionsRef.current.get(index);
              const drifted = pos ? Math.abs(pos.height - h) > 0.5 : false;
              const repaired = heightRepairRef.current.get(index) === h;

              if (!pos) {
                // 这一项还没有位置（首屏并发挂载时常见）→ 必须补一次布局
                throttledCalculateLayout();
              } else if (drifted && !repaired) {
                heightRepairRef.current.set(index, h);
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
