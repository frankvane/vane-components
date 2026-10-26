/**
 * vane-waterfall 插件装配层。
 *
 * 复用 @vane/plugin-core 的 `usePluginRuntime` / `composeSlots` / `PluginErrorBoundary`，
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

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { composeSlots, PluginErrorBoundary, usePluginRuntime } from "@vane/plugin-core";
import type { LayoutHooks } from "./layout";
import type {
  DragInfo,
  ItemPosition,
  LayoutInfo,
  NetworkInfo,
  ViewportInfo,
  WaterfallPlugin,
  WaterfallPluginContext,
} from "./plugins/types";
import type { WaterfallCoreProps, WaterfallCoreRef } from "./WaterfallCore";

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

function detectNetwork(): NetworkInfo | undefined {
  const nav = typeof navigator !== "undefined" ? (navigator as any) : undefined;
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
  if (!conn) return undefined;
  return {
    effectiveType: conn.effectiveType || "4g",
    downlink: Number(conn.downlink || 10),
    rtt: Number(conn.rtt || 50),
    saveData: Boolean(conn.saveData || false),
    online: nav?.onLine !== false,
  };
}

/** 可见索引区间（闭区间）：虚拟化关闭时也按真实重叠算，供 StickyHeader 等插件用 */
function computeVisibleIndexRange(
  positions: Map<number, ItemPosition>,
  scrollTop: number,
  clientHeight: number
): { start: number; end: number } {
  let start = Number.POSITIVE_INFINITY;
  let end = -1;
  positions.forEach((position, index) => {
    const overlap = Math.max(
      0,
      Math.min(scrollTop + clientHeight, position.y + position.height) -
        Math.max(scrollTop, position.y)
    );
    if (overlap > 0) {
      if (index < start) start = index;
      if (index > end) end = index;
    }
  });
  if (end < 0) return { start: 0, end: 0 };
  return { start, end };
}

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

      // ---------- Core 状态镜像 ----------
      const [layout, setLayout] = useState<LayoutInfo>(EMPTY_LAYOUT);
      const [itemPositions, setItemPositions] = useState<Map<number, ItemPosition>>(
        () => new Map()
      );
      const [viewport, setViewport] = useState<ViewportInfo>(EMPTY_VIEWPORT);
      const [isLayouting, setIsLayouting] = useState(false);
      const [items, setItems] = useState<T[]>((props.items ?? []) as T[]);

      const extendContext = useCallback(
        (base: any): WaterfallPluginContext<T> => {
          // 布局类字段一律「优先读 Core 实时值」：state 更新是异步的，
          // `onLayoutComplete` 里拿到的 context 仍是上一次渲染的快照——旧版就因此
          // 让插件在布局完成钩子里读不到新位置（只能自己去 DOM 里量）。
          const liveLayout = () => coreRef.current?.getLayoutInfo() ?? layout;
          const livePositions = () => coreRef.current?.getAllItemPositions() ?? itemPositions;
          const liveViewport = () => coreRef.current?.getViewportInfo() ?? viewport;

          const ctx: WaterfallPluginContext<T> = {
            ...base,
            items,
            itemCount: items.length,
            containerRef,
            itemRefs: itemRefsMap.current,
            getItemRef: (index: number) => itemRefsMap.current.get(index) ?? null,
            layout: liveLayout(),
            itemPositions: livePositions(),
            getItemPosition: (index: number) => livePositions().get(index) ?? null,
            viewport: liveViewport(),
            visibleItems: new Set<number>(),
            visibleRange: computeVisibleIndexRange(
              livePositions(),
              liveViewport().scrollTop,
              liveViewport().clientHeight
            ),
            isLayouting,
            isScrolling: viewport.isScrolling,
            isDragging: Boolean((base.state as any)?.dragInfo?.isDragging),
            isLoading: Boolean((base.state as any)?.isLoading ?? false),
            hasMore: Boolean((base.state as any)?.hasMore ?? true),
            error: ((base.state as any)?.error as Error) ?? null,
            sharedData: base.shared as Map<string, any>,
            networkInfo,
            dragInfo: (base.state as any)?.dragInfo as DragInfo | undefined,
            relayout: () => coreRef.current?.relayout(),
            scrollToItem: (index, options) => coreRef.current?.scrollToItem(index, options),
            scrollToTop: (options) => coreRef.current?.scrollToTop(options),
            scrollToBottom: (options) => coreRef.current?.scrollToBottom(options),
            measureItem: (index) =>
              coreRef.current?.measureItem(index) ?? Promise.resolve({ width: 0, height: 0 }),
          };

          // 把三个布局字段改成 getter：插件无论在哪个钩子里读，拿到的都是此刻的布局
          Object.defineProperties(ctx, {
            layout: { get: liveLayout, enumerable: true, configurable: true },
            itemPositions: { get: livePositions, enumerable: true, configurable: true },
            viewport: { get: liveViewport, enumerable: true, configurable: true },
            visibleRange: {
              get: () => {
                const vp = liveViewport();
                return computeVisibleIndexRange(livePositions(), vp.scrollTop, vp.clientHeight);
              },
              enumerable: true,
              configurable: true,
            },
          });

          return ctx;
        },
        [items, layout, itemPositions, viewport, isLayouting, networkInfo]
      );

      const kernelPlugins = plugins as any;

      const runtime = usePluginRuntime<WaterfallCoreProps<T>, any>({
        plugins: kernelPlugins,
        props,
        enableDebug,
        containerRef,
        extendContext,
      });

      // context 的最新值：布局钩子与 ref 回调都从 ref 里取，避免函数身份抖动。
      // extendContext 已经注入领域字段，但内核返回的静态类型是基础 context。
      const ctxRef = useRef(runtime.context as unknown as WaterfallPluginContext<T>);
      ctxRef.current = runtime.context as unknown as WaterfallPluginContext<T>;

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
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

        const warn = (plugin: string, hook: string, error: unknown) =>
          console.warn(`[vane-waterfall] ${plugin} 的 ${hook} 执行失败`, error);

        return {
          calculateColumns: colsPlugins.length
            ? (base) => {
                const width = ctxRef.current?.containerRef?.current?.clientWidth ?? 0;
                for (const plugin of colsPlugins) {
                  try {
                    const next = plugin.hooks.calculateColumns!(ctxRef.current, width);
                    if (typeof next === "number" && Number.isFinite(next)) return next;
                  } catch (error) {
                    warn(plugin.name, "calculateColumns", error);
                  }
                }
                return undefined;
              }
            : undefined,
          calculateColumnWidth: widthPlugins.length
            ? (base, columns, containerWidth) => {
                for (const plugin of widthPlugins) {
                  try {
                    const next = plugin.hooks.calculateColumnWidth!(
                      ctxRef.current,
                      containerWidth,
                      columns
                    );
                    if (typeof next === "number" && Number.isFinite(next)) return next;
                  } catch (error) {
                    warn(plugin.name, "calculateColumnWidth", error);
                  }
                }
                return undefined;
              }
            : undefined,
          calculateItemPosition: posPlugins.length
            ? (index, itemHeight, basePosition) => {
                for (const plugin of posPlugins) {
                  try {
                    const next = plugin.hooks.calculateItemPosition!(
                      ctxRef.current,
                      index,
                      itemHeight,
                      basePosition
                    );
                    if (next) return next;
                  } catch (error) {
                    warn(plugin.name, "calculateItemPosition", error);
                  }
                }
                return undefined;
              }
            : undefined,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [namesKey]);

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
        setItemPositions((prev) =>
          prev.size === nextPositions.size ? prev : nextPositions
        );
        setViewport((prev) =>
          prev.scrollTop === nextViewport.scrollTop &&
          prev.clientHeight === nextViewport.clientHeight &&
          prev.scrollHeight === nextViewport.scrollHeight &&
          prev.isScrolling === nextViewport.isScrolling
            ? prev
            : nextViewport
        );
      }, []);

      // items 引用变化 → 同步进上下文
      useEffect(() => {
        setItems((props.items ?? []) as T[]);
      }, [props.items]);

      // ---------- 生命周期 ----------
      // onMount：layout effect 里 manager 已注册完插件，这里触发钩子链
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onUnmount 由 @vane/plugin-core 统一执行（cleanup 里先跑钩子链再 clear）

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
      const transformedProps = runtime.transformProps(props) as WaterfallCoreProps<T>;

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
      const wrapperPlugins = orderedPlugins.filter(
        (p) => typeof p.hooks?.renderItemWrapper === "function"
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [baseRenderItem, namesKey]
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
          transformedProps.onMount?.();
          // 插件 onMount 由上面的 useEffect 统一触发，这里不重复
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
        onBeforeLayout: async () => {
          const gate = await handleBeforeLayout();
          if (gate === false) return false;
          return transformedProps.onBeforeLayout?.() ?? true;
        },
        onLayout: () => {
          transformedProps.onLayout?.();
          handleLayout();
        },
        onLayoutComplete: () => {
          transformedProps.onLayoutComplete?.();
          handleLayoutComplete();
        },

        onItemMount: (index, element) => {
          transformedProps.onItemMount?.(index, element);
          void execute("onItemMount", index, element);
        },
        onItemUnmount: (index) => {
          transformedProps.onItemUnmount?.(index);
          void execute("onItemUnmount", index);
        },
        onItemEnterViewport: (index, visibility) => {
          transformedProps.onItemEnterViewport?.(index, visibility);
          void execute("onItemEnterViewport", index, visibility);
        },
        onItemLeaveViewport: (index, visibility) => {
          transformedProps.onItemLeaveViewport?.(index, visibility);
          void execute("onItemLeaveViewport", index, visibility);
        },
        onScroll: (scrollTop, scrollLeft) => {
          transformedProps.onScroll?.(scrollTop, scrollLeft);
          void execute("onScroll", scrollTop, scrollLeft);
          // 滚动不触发 Core 重渲染（只有 handleScroll 内部的 setState），
          // 这里补一次同步，让上下文里的 viewport / visibleRange 跟上
          syncFromCore();
        },
        onResize: (width, height) => {
          transformedProps.onResize?.(width, height);
          void execute("onResize", width, height);
        },
        onReachBottom: async (distance) => {
          await transformedProps.onReachBottom?.(distance);
          await execute("onReachBottom", distance);
        },
        onItemClick: (index, item, event) => {
          transformedProps.onItemClick?.(index, item, event);
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
