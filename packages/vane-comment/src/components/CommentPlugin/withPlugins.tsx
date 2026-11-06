/**
 * withCommentPlugins - HOC 组合器（接 vane-plugin-core）
 *
 * 领域适配（对齐 vane-profile 的 withPlugins 约定）：
 *  1. 领域上下文扩展：在内核 context 基础上附加评论专属字段
 *     （sortMode / setSortMode）；extendContext 用 useCallback 稳定。
 *  2. 数据流水线：原始 → transformData（插件可过滤/遮罩/改写）→ 排序 → 透传。
 *     plugin-core 提供了 transformData 但运行时不会自动套到 context.data，
 *     这里统一套用，让 Filter / Search / Moderation 等数据级插件真正生效。
 *     `comments` 与 `data` 都写成同一份「已变换 + 已排序」的可见列表（口径统一），
 *     流水线用 useMemo 缓存：评论数组引用 / 内核 state / 排序模式不变时不再重跑。
 *  3. Core 回调 → 钩子链：onMount / onPropsChange（onUnmount 由内核统一执行）。
 *  4. 渲染插槽：列表级 renderToolbar / renderFooter 与逐条级 renderCommentActions /
 *     renderNested 由 CommentCore 经 useCommentSlot 消费，复用内核排序 + priority + 错误边界。
 *  5. 内核三槽的外部化依赖策略：vane-plugin-core 已声明为 peer，构建期外部化，不进 dist。
 *
 * priority 同向：内核「越大越先执行」，渲染插槽内「越大越靠后」，不做反转。
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type { PluginContext, PluginHooks, WithPluginsConfig } from "vane-plugin-core";
import type {
  Comment,
  CommentCoreProps,
  CommentCoreRef,
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  SortMode,
} from "./plugins/types";
import { CommentSlotProvider } from "./plugins/slots";
import { sortComments } from "./sort";

/**
 * 泛型默认值收敛为 CommentData（真实领域数据类型）。第三方以
 * `withCommentPlugins(Core, plugins)` 直接使用时仍由 Core 的 props 推断 T；
 * 自定义 data 形态的调用方请显式写泛型参数。
 */
export function withCommentPlugins<T = CommentData>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<CommentCoreProps<T>> & React.RefAttributes<CommentCoreRef>
  >,
  config: WithPluginsConfig<CommentCoreProps<T>> | CommentPlugin<T>[]
) {
  const normalized: WithPluginsConfig<CommentCoreProps<T>> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<CommentCoreRef, CommentCoreProps<T>>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      // 领域上下文扩展：只补充评论专属字段 sortMode / setSortMode。
      // 排序 + transformData 在拿到 runtime 之后再算（见下方），避免与 runtime 的鸡生蛋依赖。
      const extendContext = useCallback(
        (
          base: PluginContext<CommentCoreProps<T>, T>
        ): PluginContext<CommentCoreProps<T>, T> => {
          const mode: SortMode =
            (base.state?.sortMode as SortMode | undefined) ??
            props.defaultSortMode ??
            "custom";
          return {
            ...base,
            sortMode: mode,
            setSortMode: (m: SortMode) => base.setState({ sortMode: m }),
          } as unknown as PluginContext<CommentCoreProps<T>, T>;
        },
        [props]
      );

      const runtime = usePluginRuntime<CommentCoreProps<T>, T>({
        plugins,
        props,
        data: (props.comments ?? props.data) as T | undefined,
        containerRef,
        extendContext,
        enableDebug,
      });

      const ctxRef = useRef<CommentPluginContext<T>>(
        runtime.context as CommentPluginContext<T>
      );
      ctxRef.current = runtime.context as CommentPluginContext<T>;

      const execute = useCallback(
        (
          hookName: keyof PluginHooks<CommentCoreProps<T>, T>,
          ...args: unknown[]
        ) => runtime.execute(hookName, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const transformedProps = runtime.transformProps(props) as CommentCoreProps<T>;

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行

      // onPropsChange
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (prev !== props) {
          prevPropsRef.current = props;
          void execute("onPropsChange", prev, props);
        }
      }, [props, execute]);

      // 数据流水线：原始 → transformData（插件过滤/遮罩/改写）→ 排序 → 透传。
      // 关键：排序结果同时覆盖 `comments` 与 `data` —— CommentCore 读 `comments ?? data`，
      // 若只填 data 而消费方传了 comments（演示站 / 真实项目都这么传），排序会被原始列表覆盖、静默失效。
      // `comments` 字段在 props 类型里是固定的 `Comment[]`，`data` 才是泛型 `T`，
      // 故 comments 直接用领域类型、data 走泛型透传。
      //
      // 缓存依赖只取真正影响结果的输入：原始数据引用、transformData 链、内核 state
      // （Filter 读 state.filter、Search 读 state.query、Sort 写 state.sortMode）、排序模式。
      // 这样父级无关 state 变化（评论数组引用不变）或 ref.forceUpdate() 都不会重跑
      // 全量脱敏 + 排序，也不会产生指向新数组的 domainContext。
      const rawData = runtime.context.data;
      const pipelineState = runtime.state;
      const sortedComments = useMemo(() => {
        const baseData = ((rawData as unknown as Comment[] | undefined) ?? []);
        const transformed =
          (runtime.transformData(baseData as unknown as T) as unknown as Comment[]) ??
          baseData;
        const mode: SortMode =
          (runtime.context as CommentPluginContext<T>).sortMode ??
          props.defaultSortMode ??
          "custom";
        return sortComments(transformed, mode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [
        rawData,
        pipelineState,
        runtime.transformData,
        props.defaultSortMode,
        props.comments,
        props.data,
      ]);

      const enhancedProps: CommentCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,
        data: sortedComments as unknown as T,
        comments: sortedComments,

        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
      };

      // 领域上下文：在 runtime.context 之上覆盖排序（且经 transformData）后的评论列表，
      // 供插槽内插件（如 CountPlugin 读 comments.length、Filter/Search 读一致数据）使用。
      // `data` 也替换成同一份可见列表：否则读 context.data 的第三方插件会看到
      // 未脱敏 / 未过滤（含 pending、deleted）的原始数据，形成审核旁路与语义分裂。
      const domainContext = useMemo(
        () => ({
          ...(runtime.context as CommentPluginContext<T>),
          comments: sortedComments,
          data: sortedComments as unknown as T,
        }),
        [runtime.context, sortedComments]
      );

      return (
        <CommentSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as CommentPlugin<CommentData>[]}
          context={domainContext as unknown as CommentPluginContext<CommentData>}
        >
          <WrappedComponent
            ref={ref as React.Ref<CommentCoreRef>}
            {...enhancedProps}
          />
        </CommentSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(CommentCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
