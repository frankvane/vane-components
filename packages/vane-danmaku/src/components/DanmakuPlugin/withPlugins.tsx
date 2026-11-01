import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import type {
  DanmakuCoreProps,
  DanmakuCoreRef,
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
  Rect,
} from "./plugins/types";
import { DanmakuSlotProvider } from "./plugins/slots";

/**
 * withDanmakuPlugins —— 弹幕装配 HOC（接 vane-plugin-core）。
 *
 * 领域适配（对齐 vane-comment 的 withCommentPlugins 数据流水线约定）：
 *  1. 数据流水线：原始 items → transformData（插件过滤 / 打码 / 富化 / 重排 / 拦截指令）
 *     → 透传给 Core。plugin-core 提供 transformData 但运行时不会自动套到 context.data，
 *     这里统一套用，让 SensitiveFilter / FanBadge / PinnedTop / CmdParse 等生效。
 *  2. 防遮挡桥接：把运行时 shared 里的静态避让区 / 消费方注入的 provider，
 *     包成 avoidZoneProvider 闭包传给 Core，Core 每帧读取最新避让区（不阻塞 60fps）。
 *  3. DOM 插槽：overlay / header / footer 经 DanmakuSlotProvider 下发给 Core。
 *  4. 生命周期：onMount / onUnmount 钩子链由 HOC 转发（Core 仅调用 props.onMount）。
 */
export function withDanmakuPlugins<T = any>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<DanmakuCoreProps> & React.RefAttributes<DanmakuCoreRef>
  >,
  config: WithPluginsConfig<DanmakuCoreProps> | DanmakuPlugin<T>[]
) {
  const normalized: WithPluginsConfig<DanmakuCoreProps> = Array.isArray(config)
    ? { plugins: config as DanmakuPlugin<any>[] }
    : config;

  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<DanmakuCoreRef, DanmakuCoreProps>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      const runtime = usePluginRuntime<DanmakuCoreProps, DanmakuData>({
        plugins: plugins as DanmakuPlugin<any>[],
        props,
        data: { items: props.items, now: props.currentTime },
        containerRef,
        enableDebug,
      });

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      // 数据流水线：原始 → transformData → 透传。
      // 必须 memo：transformData 里含插件副作用（指令广播 / 审计），每次渲染重跑会重复触发；
      // 且成本是 O(插件数 × 弹幕数)，不能随父组件任意次重渲染一起放大。
      const transformed = useMemo<DanmakuData>(() => {
        const base: DanmakuData = {
          items: props.items,
          now: props.currentTime,
        };
        return (runtime.transformData(base) as DanmakuData) ?? base;
        // runtime 每次渲染都是新对象；真正决定流水线结果的是 items / 时钟 / 插件链 / state
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [props.items, props.currentTime, runtime.transformData, runtime.state]);

      // onMount / onUnmount 钩子链
      useEffect(() => {
        void execute("onMount");
      }, [execute]);
      // onUnmount 由内核卸载 useLayoutEffect 统一执行

      // 防遮挡桥接：优先消费方 provider，否则静态避让区
      const avoidZoneProvider = useCallback((): Rect[] => {
        const shared = runtime.context.shared;
        const provider = shared.get("avoidZoneProvider") as
          | (() => Rect[])
          | undefined;
        if (provider) return provider();
        return (shared.get("avoidZones") as Rect[]) ?? [];
      }, [runtime.context.shared]);

      const transformedProps = runtime.transformProps(props) as DanmakuCoreProps;

      const enhancedProps: DanmakuCoreProps = {
        ...transformedProps,
        items: transformed.items,
        currentTime: props.currentTime,
        playing: props.playing,
        // 样式类 props 取 transformProps 结果，让插件能通过 transformProps 改主题/排版
        trackHeight: transformedProps.trackHeight,
        baseFontSize: transformedProps.baseFontSize,
        opacity: transformedProps.opacity,
        containerRefExternal: containerRef,
        avoidZoneProvider,
        debug: transformedProps.debug ?? enableDebug,

        onMount: () => transformedProps.onMount?.(),
        onUnmount: () => transformedProps.onUnmount?.(),
      };

      // 领域上下文：在 runtime.context 之上覆盖 transformData 后的数据
      const domainContext: DanmakuPluginContext<T> = {
        ...(runtime.context as DanmakuPluginContext<T>),
        data: transformed,
      };

      return (
        <DanmakuSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as DanmakuPlugin<any>[]}
          context={domainContext}
        >
          <WrappedComponent
            ref={ref as React.Ref<DanmakuCoreRef>}
            {...enhancedProps}
          />
        </DanmakuSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(DanmakuCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig };
