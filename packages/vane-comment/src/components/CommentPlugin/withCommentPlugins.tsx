/**
 * withCommentPlugins - HOC 组合器（接 vane-plugin-core）
 *
 * 领域适配（对齐 vane-profile 的 withPlugins 约定）：
 *  1. 领域上下文扩展：在内核 context 基础上附加评论专属字段
 *     （comments = sortComments(data, sortMode) / sortMode / setSortMode）；
 *     extendContext 用 useCallback 稳定，每次 context 重建时重新应用排序。
 *  2. Core 回调 → 钩子链：onMount / onPropsChange（onUnmount 由内核统一执行）。
 *  3. 渲染插槽：列表级 renderToolbar / renderFooter 与逐条级 renderCommentActions /
 *     renderNested 由 CommentCore 经 useCommentSlot 消费，复用内核排序 + priority + 错误边界。
 *  4. 内核三槽的外部化依赖策略：vane-plugin-core 已声明为 peer，构建期外部化，不进 dist。
 *
 * priority 同向：内核「越大越先执行」，渲染插槽内「越大越靠后」，不做反转。
 */

import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import type {
  CommentCoreProps,
  CommentCoreRef,
  CommentPlugin,
  CommentPluginContext,
  SortMode,
} from "./plugins/types";
import { CommentSlotProvider } from "./plugins/slots";
import { sortComments } from "./sort";

export function withCommentPlugins<T = any>(
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

      // 领域上下文扩展：在内核 context 基础上附加评论专属字段。
      // base.data 是原始评论列表；按 state.sortMode（无则由 props.defaultSortMode /
      // "custom" 兜底）排序后产出 comments。setSortMode 写入内核 state（base.setState），
      // 触发 context 重建 → 列表重排。
      const extendContext = useCallback(
        (base: any): any => {
          const raw = (base.data as any[] | undefined) ?? [];
          const mode: SortMode =
            (base.state?.sortMode as SortMode | undefined) ??
            props.defaultSortMode ??
            "custom";
          const comments = sortComments(raw, mode);
          return {
            ...base,
            comments,
            sortMode: mode,
            setSortMode: (m: SortMode) => base.setState({ sortMode: m }),
          };
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
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
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

      // 经排序后的评论列表透给 Core（Core 读 props.data）
      const enhancedProps: CommentCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,
        data: ctxRef.current.comments as unknown as T,

        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
      };

      return (
        <CommentSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as CommentPlugin<any>[]}
          context={runtime.context as unknown as CommentPluginContext<T>}
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
