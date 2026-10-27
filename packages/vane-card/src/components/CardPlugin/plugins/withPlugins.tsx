/**
 * withPlugins - HOC 组合器（C2 · 接 vane-plugin-core）
 *
 * 旧版自建 PluginBus/PluginManager/SlotsContext（约 1154 行）全部删除，改用内核
 * usePluginRuntime + composeSlots + PluginErrorBoundary。领域适配在此补齐：
 *
 *  1. 领域上下文：内核 context + cardId / data / size / getContainer / getSize /
 *     sharedData / bus；
 *  2. Core 回调 → 钩子链：onMount / onClick / onHover / onVisibilityChange / onResize；
 *  3. onStateChange 从 setState 的 updater 内移出，改为 state 变化后 in useEffect 触发
 *     （updater 保持纯函数，避免旧版在 updater 内同步触发导致的重渲染抖动）；
 *  4. 渲染插槽：composeSlots（before-header → children → overlay → after-header → footer），
 *     与 C0.6 快照的五段顺序一致；价格区走包内领域槽（见 slots.tsx）；
 *  5. R2 修复：onMount 返回值（清理函数）交内核 —— 内核在 clear() 时逆序执行，
 *     不再像旧版那样 .catch(()=>{}) 丢弃；
 *  6. onUnmount 不在此重复触发：内核在卸载的 useLayoutEffect 里已执行
 *     executeHook("onUnmount") + clear()，这里只透传用户原始回调。
 *
 * priority 同向：旧版「越大越先注册」= 新版「越大越先执行」，不做反转适配。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  composeSlots,
  PluginErrorBoundary,
  usePluginRuntime,
} from "vane-plugin-core";
import type { CardCoreProps, CardCoreRef } from "../core/CardCore";
import type {
  CardPlugin,
  CardPluginContext,
  CardSize,
  CardState,
  DeviceInfo,
  PluginBus,
  WithPluginsConfig,
} from "./types";
import { CardSlotProvider } from "./slots";

export interface WithPluginsConfigInternal<T = any> {
  plugins: CardPlugin<T>[];
  enableDebug?: boolean;
}

const INITIAL_STATE: CardState = {
  isHovered: false,
  isVisible: false,
  isActive: false,
  isSelected: false,
  cart: false,
  wishlist: false,
};

export function withPlugins<T = any>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<CardCoreProps<T>> & React.RefAttributes<CardCoreRef>
  >,
  config: WithPluginsConfig<T> | CardPlugin<T>[]
) {
  const normalized: WithPluginsConfig<T> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<CardCoreRef, CardCoreProps<T>>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const coreRef = useRef<CardCoreRef | null>(null);
      const transformedPropsRef = useRef<CardCoreProps<T>>(props);

      // 插件数组 → 内核插件。
      // 领域字段适配：vane-card 的公开配置叫 headerPosition（before/after），
      // 内核认的是 config.slotPosition，这里做一次映射；不做的话 headerPosition
      // 会被内核忽略，所有头部插件都落到默认的 after 段。
      const kernelPlugins = useMemo(
        () =>
          plugins.map((p) => {
            const hp = (p.config as { headerPosition?: string } | undefined)
              ?.headerPosition;
            if (hp !== "before" && hp !== "after") return p as any;
            return {
              ...p,
              config: { ...(p.config as object), slotPosition: hp },
            } as any;
          }),
        [plugins]
      );

      // 领域上下文扩展：在内核 context 基础上附加卡片专属字段
      // 返回类型放宽到 any：内核要求返回 PluginContext，而领域 CardPluginContext 是
      // 在其上叠加字段的超集（含 base 的 refs/shared/logger），结构兼容，仅需绕过
      // 类型系统的精确匹配。
      const extendContext = useCallback(
        (base: any): any => {
          const tProps = () =>
            (transformedPropsRef.current as CardCoreProps<T>) ??
            (props as CardCoreProps<T>);
          const size = (): CardSize =>
            base.getSize ? (base.getSize() as CardSize) : { width: 0, height: 0 };

          const ctx: CardPluginContext<T> = {
            ...base,
            cardId: props.cardId,
            data: props.data as T | undefined,
            containerRef: (base.refs?.container ??
              containerRef) as React.RefObject<HTMLDivElement | null>,
            getContainer: () =>
              (base.refs?.getContainer
                ? base.refs.getContainer()
                : null) as HTMLDivElement | null,
            state: (base.state ?? {}) as CardState,
            setState: (updates: Partial<CardState>) => base.setState(updates),
            size: size(),
            props: tProps(),
            bus: base.bus as PluginBus,
            sharedData: (base.shared as Map<string, any>) ?? new Map(),
            deviceInfo: base.deviceInfo as DeviceInfo,
            forceUpdate: base.forceUpdate,
            getSize: () => size(),
          };

          // 动态 getter：props 取 transformProps 之后；data / size 实时读取
          Object.defineProperties(ctx, {
            props: { get: tProps, enumerable: true, configurable: true },
            data: {
              get: () => props.data as T | undefined,
              enumerable: true,
              configurable: true,
            },
            size: { get: size, enumerable: true, configurable: true },
          });
          return ctx;
        },
        [props]
      );

      const runtime = usePluginRuntime<CardCoreProps<T>, T>({
        plugins: kernelPlugins,
        props,
        data: props.data,
        initialState: INITIAL_STATE as unknown as Record<string, unknown>,
        containerRef,
        extendContext,
        enableDebug,
      });

      // 最新 context（供 ref 回调 / 钩子链读取）
      const ctxRef = useRef(runtime.context as unknown as CardPluginContext<T>);
      ctxRef.current = runtime.context as unknown as CardPluginContext<T>;

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const transformedProps = runtime.transformProps(props) as CardCoreProps<T>;
      transformedPropsRef.current = transformedProps;

      // onMount：layout effect 之后触发钩子链（内核不自动跑 onMount）
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行（executeHook + clear）

      // onStateChange：state 变化后触发（updater 保持纯函数）
      const prevStateRef = useRef<Record<string, unknown>>(runtime.state);
      useEffect(() => {
        const prev = prevStateRef.current;
        const next = runtime.state;
        if (prev !== next) {
          prevStateRef.current = next;
          void execute("onStateChange", prev, next);
        }
      }, [runtime.state, execute]);

      // onPropsChange
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (prev !== props) {
          prevPropsRef.current = props;
          void execute("onPropsChange", prev, props);
        }
      }, [props, execute]);

      // onResize：通过 ResizeObserver 触发（Core 本身不暴露 resize 回调）
      useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;
          const { width, height } = entry.contentRect;
          void execute("onResize", width, height);
        });
        ro.observe(el);
        return () => ro.disconnect();
      }, [execute]);

      const enhancedProps: CardCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,

        // 用户原始生命周期回调（插件链由上面 useEffect 触发，避免重复）
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },

        // Core 交互回调 → 钩子链
        onClick: (event) => {
          transformedProps.onClick?.(event);
          void execute("onClick", event);
        },
        onHover: (isHovered) => {
          runtime.setState({ isHovered });
          transformedProps.onHover?.(isHovered);
          void execute("onHover", isHovered);
        },
        onVisibilityChange: (isVisible) => {
          runtime.setState({ isVisible });
          transformedProps.onVisibilityChange?.(isVisible);
          void execute("onVisibilityChange", isVisible);
        },

        // 子元素 + 插件渲染区域（composeSlots 五段）
        children: (
          <PluginErrorBoundary>
            {composeSlots(
              runtime.orderedPlugins,
              runtime.context,
              transformedProps.children
            )}
          </PluginErrorBoundary>
        ),
      };

      return (
        <CardSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as CardPlugin<any>[]}
          context={runtime.context as unknown as CardPluginContext<T>}
        >
          <WrappedComponent
            ref={(node: CardCoreRef | null) => {
              coreRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref)
                (ref as React.MutableRefObject<CardCoreRef | null>).current = node;
            }}
            {...enhancedProps}
          />
        </CardSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(CardCore)";
  return WithPluginsComponent;
}

export default withPlugins;
