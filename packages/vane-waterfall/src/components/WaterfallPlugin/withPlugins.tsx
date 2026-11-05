/**
 * vane-waterfall 插件装配层。
 *
 * 复用 vane-plugin-core 的 `usePluginRuntime` / `composeSlots` / `PluginErrorBoundary`，
 * 在此补齐瀑布流领域适配（与旧自建插件系统的差异见 tasks/07 · 4.1–4.7）：
 *
 *  1. 领域上下文：内核 context + items / layout / itemPositions / viewport / 状态位 /
 *     itemRefs / relayout / scrollTo* / measureItem；
 *  2. Core 回调 → 钩子链：onBeforeLayout（可返回 false 阻断）→ onLayout → onLayoutComplete、
 *     项生命周期、滚动、Resize、触底、点击；
 *  3. `layoutHooks`：把 D1-A 三个布局钩子汇总成纯函数组，交给 Core 在布局里调用
 *     （走 ref 取最新 context，函数身份保持稳定，避免布局 ↔ 渲染互相触发）；
 *  4. 渲染插槽：`renderOverlay` 走 composeSlots，且由 Core 渲染在**滚动容器内部**
 *     （旧版也是，但没有任何断言锁住，这里补了单测）；
 *  5. `renderItemWrapper`：逐个包裹 `props.renderItem` 的结果，替代旧版同名机制。
 *     旧版签名在 A11y（content 在前）与 DragReorder（index 在前）之间不一致，
 *     这里统一成 `(context, node, index)`。
 *
 * **注意 priority 同向**：旧版「越大越先注册」= 新版「越大越先执行」，不做
 * lazy-image 那种 `1000 - x` 反转（见 tasks/07 · 4.3，照抄会直接引入 bug）。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { composeSlots, PluginErrorBoundary, usePluginRuntime } from "vane-plugin-core";
import type { Plugin, PluginContext } from "vane-plugin-core";
import type { LayoutHooks } from "./layout";
import type {
  DragInfo,
  ItemPosition,
  LayoutInfo,
  NetworkInfo,
  ViewportInfo,
  WaterfallData,
  WaterfallPlugin,
  WaterfallPluginContext,
} from "./plugins/types";
import type { WaterfallCoreProps, WaterfallCoreRef } from "./WaterfallCore";

/**
 * 泛型默认值说明：与 plugins/types.ts 同因——调用方大量以 `withPlugins(WaterfallCore, ...)`
 * 或 `WithPluginsConfig` 的简写形态使用；默认值改 unknown 会让 T 推断成 unknown，
 * demo 的 `renderItem` / `keyExtractor` 参数随之失去具体类型。保留 any 作为「未指定」占位。
 */
export interface WithPluginsConfig<T = any> {
  plugins: WaterfallPlugin<T>[];
  enableDebug?: boolean;
}

const EMPTY_LAYOUT: LayoutInfo = {
  columns: 0,
  columnWidth: 0,
  gap: 0,
  columnHeights: [],
  totalHeight: 0,
  containerWidth: 0,
  containerHeight: 0,
};

const EMPTY_VIEWPORT: ViewportInfo = {
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 0,
  scrollWidth: 0,
  clientHeight: 0,
  clientWidth: 0,
  isScrolling: false,
  direction: null,
};

/**
 * 消费方回调隔层：宿主传入的 `onXxx` 抛错时只告警，不能中断插件链与布局流程。
 * 旧实现把它们直接串在一起，任一回调抛错都会连带后续钩子不执行（P1-1 的另一半）。
 */
function safeCall<A extends unknown[], R>(
  label: string,
  fn: ((...args: A) => R) | undefined,
  ...args: A
): R | undefined {
  if (typeof fn !== "function") return undefined;
  try {
    return fn(...args);
  } catch (error) {
    console.warn(`[vane-waterfall] ${label} 回调抛错，已忽略`, error);
    return undefined;
  }
}

/** `safeCall` 的异步版：async 回调的 reject 也要吞掉 */
async function safeAwait<A extends unknown[], R>(
  label: string,
  fn: ((...args: A) => R | Promise<R>) | undefined,
  ...args: A
): Promise<R | undefined> {
  if (typeof fn !== "function") return undefined;
  try {
    return await fn(...args);
  } catch (error) {
    console.warn(`[vane-waterfall] ${label} 回调抛错，已忽略`, error);
    return undefined;
  }
}

interface NetworkConnectionLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/** 各浏览器暴露连接信息的前缀不同（标准 / Firefox / WebKit） */
type NavigatorWithConnection = Navigator & {
  connection?: NetworkConnectionLike;
  mozConnection?: NetworkConnectionLike;
  webkitConnection?: NetworkConnectionLike;
};

function detectNetwork(): NetworkInfo | undefined {
  const nav =
    typeof navigator !== "undefined" ? (navigator as NavigatorWithConnection) : undefined;
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
  if (!conn) return undefined;
  return {
    effectiveType: (conn.effectiveType || "4g") as NetworkInfo["effectiveType"],
    downlink: Number(conn.downlink || 10),
    rtt: Number(conn.rtt || 50),
    saveData: Boolean(conn.saveData || false),
    online: nav?.onLine !== false,
  };
}

/** 可见集合与闭区间一次算出：虚拟化关闭时也按真实重叠算，供 StickyHeader 等插件用 */
function scanVisible(
  positions: Map<number, ItemPosition>,
  scrollTop: number,
  clientHeight: number
): { set: Set<number>; range: { start: number; end: number } } {
  let start = Number.POSITIVE_INFINITY;
  let end = -1;
  const set = new Set<number>();
  positions.forEach((position, index) => {
    const overlap = Math.min(scrollTop + clientHeight, position.y + position.height) -
      Math.max(scrollTop, position.y);
    if (overlap > 0) {
      set.add(index);
      if (index < start) start = index;
      if (index > end) end = index;
    }
  });
  return { set, range: end < 0 ? { start: 0, end: 0 } : { start, end } };
}

// T 默认 any：与 plugins/types.ts 的「泛型默认值说明」同因（HOC 常被简写调用）
export function withPlugins<T = any>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<WaterfallCoreProps<T>> &
      React.RefAttributes<WaterfallCoreRef>
  >,
  config: WithPluginsConfig<T> | WaterfallPlugin<T>[]
) {
  const normalized: WithPluginsConfig<T> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<WaterfallCoreRef, WaterfallCoreProps<T>>(
    (props, ref) => {
      // ---------- refs ----------
      const containerRef = useRef<HTMLDivElement | null>(null);
      const itemRefsMap = useRef<Map<number, HTMLElement>>(new Map());
      const coreRef = useRef<WaterfallCoreRef | null>(null);
      const networkInfo = useMemo(() => detectNetwork(), []);
      /**
       * 最近一次 `transformProps` 的结果。
       *
       * 插件钩子里的 `context.props` 必须是 **Core 真正收到的那份**，否则插件之间没法
       * 通过 `transformProps` 传参：GapPlugin 把 `columnGap / rowGap` 写进 props 之后，
       * PinItemPlugin 读 `context.props.rowGap` 仍是 undefined —— 它退化成 gap=0，
       * 表现为置顶块与下一项上下贴死、x 少一个 columnGap。
       */
      const transformedPropsRef = useRef<WaterfallCoreProps<T> | null>(null);

      // ---------- Core 状态镜像 ----------
      const [layout, setLayout] = useState<LayoutInfo>(EMPTY_LAYOUT);
      const [itemPositions, setItemPositions] = useState<Map<number, ItemPosition>>(
        () => new Map()
      );
      const [viewport, setViewport] = useState<ViewportInfo>(EMPTY_VIEWPORT);
      const [isLayouting, setIsLayouting] = useState(false);
      /**
       * `transformProps` 的显式失效计数。
       *
       * 结果按「props 身份 + 插件链身份」缓存：否则每次渲染都跑一遍数据管线，
       * Filter/Sort/Search/Pagination 每次产出**新 items 数组** → Core 认为数据集变了
       * → 全量重排（P1-3）。插件在 props 没变但需要重算时（GapPlugin 的容器宽度换档）
       * 通过 `bus.emit("props:invalidate")` 加一。
       */
      const [transformVersion, setTransformVersion] = useState(0);

      const extendContext = useCallback(
        (
          base: PluginContext<WaterfallCoreProps<T>, WaterfallData>
        ): WaterfallPluginContext<T> => {
          // 布局类字段一律「优先读 Core 实时值」：state 更新是异步的，
          // `onLayoutComplete` 里拿到的 context 仍是上一次渲染的快照——旧版就因此
          // 让插件在布局完成钩子里读不到新位置（只能自己去 DOM 里量）。
          const liveLayout = () => coreRef.current?.getLayoutInfo() ?? layout;
          const livePositions = () => coreRef.current?.getAllItemPositions() ?? itemPositions;
          const liveViewport = () => coreRef.current?.getViewportInfo() ?? viewport;
          // 渲染集合：数据插件（Filter/Sort/Search/Pagination）改写后的 items。
          // 旧实现给的是 props.items 原始集合，插件看到的项数与实际渲染的不一致（P2-1）
          const liveItems = (): T[] =>
            ((transformedPropsRef.current?.items ??
              (base.props as WaterfallCoreProps<T> | undefined)?.items ??
              []) as T[]);
          // 原始集合（未经数据插件改写），给需要「总条数」的插件用
          const liveRawItems = (): T[] =>
            (((base.props as WaterfallCoreProps<T> | undefined)?.items ?? []) as T[]);
          const liveVisibleItems = (): Set<number> => {
            const fromCore = coreRef.current?.getVisibleItems();
            if (fromCore && fromCore.size > 0) return fromCore;
            // 首帧 Core 还没滚动过：按位置与视口的重叠兜底算一次
            const vp = liveViewport();
            return scanVisible(livePositions(), vp.scrollTop, vp.clientHeight).set;
          };

          // 布局类字段先不写值：下面统一用 defineProperties 装 getter
          const ctx = {
            ...base,
            containerRef,
            itemRefs: itemRefsMap.current,
            getItemRef: (index: number) => itemRefsMap.current.get(index) ?? null,
            getItemPosition: (index: number) => livePositions().get(index) ?? null,
            isLayouting,
            isScrolling: viewport.isScrolling,
            isDragging: Boolean((base.state.dragInfo as DragInfo | undefined)?.isDragging),
            error: (base.state.error as Error | undefined) ?? null,
            sharedData: base.shared as WaterfallPluginContext<T>["sharedData"],
            networkInfo,
            dragInfo: base.state.dragInfo as DragInfo | undefined,
            relayout: () => coreRef.current?.relayout(),
            scrollToItem: (index, options) => coreRef.current?.scrollToItem(index, options),
            scrollToTop: (options) => coreRef.current?.scrollToTop(options),
            scrollToBottom: (options) => coreRef.current?.scrollToBottom(options),
            measureItem: (index) =>
              coreRef.current?.measureItem(index) ?? Promise.resolve({ width: 0, height: 0 }),
          } as WaterfallPluginContext<T>;

          // 把三个布局字段改成 getter：插件无论在哪个钩子里读，拿到的都是此刻的布局
          // props 同理走 getter（见 transformedPropsRef 的说明）
          Object.defineProperties(ctx, {
            layout: { get: liveLayout, enumerable: true, configurable: true },
            itemPositions: { get: livePositions, enumerable: true, configurable: true },
            viewport: { get: liveViewport, enumerable: true, configurable: true },
            items: { get: liveItems, enumerable: true, configurable: true },
            itemCount: {
              get: () => liveItems().length,
              enumerable: true,
              configurable: true,
            },
            rawItems: { get: liveRawItems, enumerable: true, configurable: true },
            visibleItems: { get: liveVisibleItems, enumerable: true, configurable: true },
            // 宿主 props 优先：`hasMore` / `isLoading` 从「恒 true / 恒 false」改成
            // 「props 能覆盖插件状态」，页面不用 hand-roll 一个插件就能控制（P2-2）
            hasMore: {
              get: () =>
                transformedPropsRef.current?.hasMore ??
                ((base.state.hasMore as boolean | undefined) ?? true),
              enumerable: true,
              configurable: true,
            },
            isLoading: {
              get: () =>
                transformedPropsRef.current?.isLoading ??
                ((base.state.isLoading as boolean | undefined) ?? false),
              enumerable: true,
              configurable: true,
            },
            props: {
              get: () =>
                (transformedPropsRef.current ??
                  (base.props as WaterfallCoreProps<T>)) as WaterfallCoreProps<T>,
              enumerable: true,
              configurable: true,
            },
            visibleRange: {
              get: () => {
                const vp = liveViewport();
                return scanVisible(livePositions(), vp.scrollTop, vp.clientHeight).range;
              },
              enumerable: true,
              configurable: true,
            },
          });

          return ctx;
        },
        [layout, itemPositions, viewport, isLayouting, networkInfo]
      );

      // 领域插件 → 内核插件：钩子收窄是 Omit 出来的领域签名，运行时同构，
      // 这里是唯一的类型擦除边界（与 plugin-core 的 withPlugins 同款做法）
      const kernelPlugins = plugins as unknown as Plugin<
        WaterfallCoreProps<T>,
        WaterfallData
      >[];

      const runtime = usePluginRuntime<WaterfallCoreProps<T>, WaterfallData>({
        plugins: kernelPlugins,
        props,
        enableDebug,
        containerRef,
        extendContext,
      });

      // context 的最新值：布局钩子与 ref 回调都从 ref 里取，避免函数身份抖动。
      // extendContext 已经注入领域字段，但内核返回的静态类型是基础 context。
      // 在 layout effect 里同步而不是渲染期直接写：并发渲染下被丢弃的那次渲染也会写 ref，
      // 异步布局钩子就可能读到一份从未提交的 context（P2-10）
      const ctxRef = useRef(runtime.context as unknown as WaterfallPluginContext<T>);
      useLayoutEffect(() => {
        ctxRef.current = runtime.context as unknown as WaterfallPluginContext<T>;
      });

      // 插件请求「props 没变但需要重算 transformProps」时（例如 GapPlugin 的容器宽度换档）
      useEffect(
        () => runtime.bus.on("props:invalidate", () => setTransformVersion((v) => v + 1)),
        [runtime.bus]
      );

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) => runtime.execute(hookName, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const orderedPlugins = runtime.orderedPlugins as WaterfallPlugin<T>[];
      const namesKey = plugins.map((p) => p.name).join("|");

      // ---------- D1-A：布局钩子汇总 ----------
      const layoutHooks = useMemo<LayoutHooks | undefined>(() => {
        const colsPlugins = orderedPlugins.filter(
          (p) => typeof p.hooks?.calculateColumns === "function"
        );
        const widthPlugins = orderedPlugins.filter(
          (p) => typeof p.hooks?.calculateColumnWidth === "function"
        );
        const posPlugins = orderedPlugins.filter(
          (p) => typeof p.hooks?.calculateItemPosition === "function"
        );
        if (!colsPlugins.length && !widthPlugins.length && !posPlugins.length) {
          return undefined;
        }

        const runHooks = <R,>(
          hook: "calculateColumns" | "calculateColumnWidth" | "calculateItemPosition",
          list: WaterfallPlugin<T>[],
          call: (plugin: WaterfallPlugin<T>) => R,
          accept: (value: R | undefined) => boolean
        ): R | undefined => {
          for (const plugin of list) {
            try {
              const next = call(plugin);
              if (accept(next)) return next;
            } catch (error) {
              console.warn(`[vane-waterfall] ${plugin.name} 的 ${hook} 执行失败`, error);
            }
          }
          return undefined;
        };

        return {
          calculateColumns: colsPlugins.length
            ? () => {
                const width = ctxRef.current?.containerRef?.current?.clientWidth ?? 0;
                return runHooks(
                  "calculateColumns",
                  colsPlugins,
                  (plugin) => plugin.hooks.calculateColumns!(ctxRef.current, width),
                  (next) => typeof next === "number" && Number.isFinite(next)
                );
              }
            : undefined,
          calculateColumnWidth: widthPlugins.length
            ? (_base, columns, containerWidth) =>
                runHooks(
                  "calculateColumnWidth",
                  widthPlugins,
                  (plugin) =>
                    plugin.hooks.calculateColumnWidth!(ctxRef.current, containerWidth, columns),
                  (next) => typeof next === "number" && Number.isFinite(next)
                )
            : undefined,
          calculateItemPosition: posPlugins.length
            ? (index, itemHeight, basePosition) =>
                runHooks(
                  "calculateItemPosition",
                  posPlugins,
                  (plugin) =>
                    plugin.hooks.calculateItemPosition!(
                      ctxRef.current,
                      index,
                      itemHeight,
                      basePosition
                    ),
                  (next) => Boolean(next)
                )
            : undefined,
        };
        // 按插件对象身份重建：只依赖 namesKey 时，「同名换配置」的插件仍会沿用旧闭包（P2-10）
      }, [orderedPlugins]);

      // ---------- 状态同步（布局完成后从 Core 读回来） ----------
      const syncFromCore = useCallback(() => {
        const core = coreRef.current;
        if (!core) return;
        const nextLayout = core.getLayoutInfo();
        const nextPositions = core.getAllItemPositions();
        const nextViewport = core.getViewportInfo();
        setLayout((prev) =>
          prev.totalHeight === nextLayout.totalHeight &&
          prev.columns === nextLayout.columns &&
          prev.columnWidth === nextLayout.columnWidth &&
          prev.containerWidth === nextLayout.containerWidth
            ? prev
            : nextLayout
        );
        setItemPositions((prev) => {
          if (prev === nextPositions) return prev;
          if (prev.size !== nextPositions.size) return nextPositions;
          let same = true;
          nextPositions.forEach((position, index) => {
            if (same === false) return;
            const old = prev.get(index);
            if (
              !old ||
              old.x !== position.x ||
              old.y !== position.y ||
              old.width !== position.width ||
              old.height !== position.height ||
              old.column !== position.column
            ) {
              same = false;
            }
          });
          // 只比 size 会让「项数不变、位置全变」的布局被吞掉（P2-10）
          return same ? prev : nextPositions;
        });
        setViewport((prev) =>
          prev.scrollTop === nextViewport.scrollTop &&
          prev.clientHeight === nextViewport.clientHeight &&
          prev.scrollHeight === nextViewport.scrollHeight &&
          prev.isScrolling === nextViewport.isScrolling
            ? prev
            : nextViewport
        );
      }, []);

      // transformProps 结果缓存：props 身份不变时复用同一份结果，
      // 数据插件产出的 items 数组也就保持同一引用 → Core 不必全量重排（P1-3）
      const transformedProps = useMemo(() => {
        // transformVersion 是插件的显式失效信号（见 props:invalidate）
        void transformVersion;
        return runtime.transformProps(props) as WaterfallCoreProps<T>;
      // 依赖只列 runtime.transformProps（它在 runtime 生命周期内身份稳定）。
      // 列 runtime 本身会让每个渲染都产生新对象 → 这里必然重算，缓存失效（P1-3）。
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [runtime.transformProps, props, transformVersion]);

      // 分页与无限加载互斥：同时启用时两者都会改写 items，谁在链尾谁生效，
      // 表现为「翻页后被无限加载的追加结果覆盖」——装的时候就说清楚（P2-3）
      useEffect(() => {
        if (
          plugins.some((p) => p.name === "PaginationPlugin") &&
          plugins.some((p) => p.name === "InfiniteScrollPlugin")
        ) {
          console.warn(
            "[vane-waterfall] PaginationPlugin 与 InfiniteScrollPlugin 互斥：两者都会改写 items，请只保留一个"
          );
        }
      }, [namesKey]);

      // ---------- 生命周期 ----------
      // onMount：layout effect 里 manager 已注册完插件，这里触发钩子链
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onUnmount 由 vane-plugin-core 统一执行（cleanup 里先跑钩子链再 clear）

      // props 变化
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (prev !== props) {
          prevPropsRef.current = props;
          void execute("onPropsChange", prev, props);
        }
      }, [props, execute]);

      // ---------- Core 回调 → 钩子链 ----------
      // 插件钩子里的 `context.props` 必须是 Core 真正收到的那份（transformProps 的结果）。
      // 这个镜像保持渲染期赋值：`renderItemWrapper` 是在渲染期调用的，若延后到 layout effect，
      // 首次渲染就会拿到未改写的原始 props。异步钩子走的是 ctxRef（见上方说明）。
      transformedPropsRef.current = transformedProps;

      const handleBeforeLayout = useCallback(async () => {
        setIsLayouting(true);
        const result = await execute("onBeforeLayout");
        if (result === false) {
          setIsLayouting(false);
          return false;
        }
        return true;
      }, [execute]);

      const handleLayout = useCallback(() => {
        void execute("onLayout");
      }, [execute]);

      const handleLayoutComplete = useCallback(() => {
        setIsLayouting(false);
        void execute("onLayoutComplete");
        // 钩子链跑完再同步：插件在 onLayoutComplete 里调 relayout 也能读到新值
        Promise.resolve().then(syncFromCore);
      }, [execute, syncFromCore]);

      // ---------- 项包装管道 ----------
      const wrapperPlugins = useMemo(
        () => orderedPlugins.filter((p) => typeof p.hooks?.renderItemWrapper === "function"),
        [orderedPlugins]
      );
      const baseRenderItem = transformedProps.renderItem;

      const renderItemWithWrappers = useCallback(
        (item: T, index: number): React.ReactNode => {
          let node = baseRenderItem?.(item, index) ?? null;
          for (const plugin of wrapperPlugins) {
            try {
              const next = plugin.hooks.renderItemWrapper!(ctxRef.current, node, index);
              if (next !== undefined && next !== null) node = next;
            } catch (error) {
              console.warn(`[vane-waterfall] ${plugin.name} 的 renderItemWrapper 失败`, error);
            }
          }
          return node;
        },
        // 身份保持稳定（插件链与基础 renderItem 不变时不变）：Core 里项单元是 memo 的，
        // 这里每次渲染都给新函数等于把 memo 全部击穿（P2-11）
        [baseRenderItem, wrapperPlugins]
      );

      const enhancedProps: WaterfallCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        itemRefsExternal: itemRefsMap,
        debug: transformedProps.debug ?? enableDebug,
        layoutHooks: layoutHooks ?? transformedProps.layoutHooks,
        renderItem: renderItemWithWrappers,
        children: (
          <PluginErrorBoundary>
            {composeSlots(runtime.orderedPlugins, runtime.context, transformedProps.children)}
          </PluginErrorBoundary>
        ),

        onMount: () => {
          safeCall("onMount", transformedProps.onMount);
          // 插件 onMount 由上面的 useEffect 统一触发，这里不重复
        },
        onUnmount: () => {
          safeCall("onUnmount", transformedProps.onUnmount);
        },
        onBeforeLayout: async () => {
          const gate = await handleBeforeLayout();
          if (gate === false) return false;
          // 消费方回调抛错不能连带本次布局一起中止（P1-1）
          const result = await safeAwait("onBeforeLayout", transformedProps.onBeforeLayout);
          return result ?? true;
        },
        onLayout: () => {
          safeCall("onLayout", transformedProps.onLayout);
          handleLayout();
        },
        onLayoutComplete: () => {
          safeCall("onLayoutComplete", transformedProps.onLayoutComplete);
          handleLayoutComplete();
        },

        onItemMount: (index, element) => {
          safeCall("onItemMount", transformedProps.onItemMount, index, element);
          void execute("onItemMount", index, element);
        },
        onItemUnmount: (index) => {
          safeCall("onItemUnmount", transformedProps.onItemUnmount, index);
          void execute("onItemUnmount", index);
        },
        onItemEnterViewport: (index, visibility) => {
          safeCall("onItemEnterViewport", transformedProps.onItemEnterViewport, index, visibility);
          void execute("onItemEnterViewport", index, visibility);
        },
        onItemLeaveViewport: (index, visibility) => {
          safeCall("onItemLeaveViewport", transformedProps.onItemLeaveViewport, index, visibility);
          void execute("onItemLeaveViewport", index, visibility);
        },
        onScroll: (scrollTop, scrollLeft) => {
          safeCall("onScroll", transformedProps.onScroll, scrollTop, scrollLeft);
          void execute("onScroll", scrollTop, scrollLeft);
          // 滚动不触发 Core 重渲染（只有 handleScroll 内部的 setState），
          // 这里补一次同步，让上下文里的 viewport / visibleRange 跟上
          syncFromCore();
        },
        onResize: (width, height) => {
          safeCall("onResize", transformedProps.onResize, width, height);
          void execute("onResize", width, height);
        },
        onReachBottom: async (distance) => {
          await safeAwait("onReachBottom", transformedProps.onReachBottom, distance);
          await execute("onReachBottom", distance);
        },
        onItemClick: (index, item, event) => {
          safeCall("onItemClick", transformedProps.onItemClick, index, item, event);
          void execute("onItemClick", index, item, event);
        },
      };

      return (
        <WrappedComponent
          ref={(node: WaterfallCoreRef | null) => {
            coreRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.MutableRefObject<WaterfallCoreRef | null>).current = node;
          }}
          {...enhancedProps}
        />
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(WaterfallCore)";
  return WithPluginsComponent;
}

export default withPlugins;
