import React, { forwardRef } from "react";
import { usePluginRuntime } from "./usePluginRuntime";
import { PluginRuntimeProvider } from "./PluginRuntimeProvider";
import { composeSlots } from "./slots";
import type { Plugin, WithPluginsConfig } from "../types";

type AnyProps = Record<string, any>;

/**
 * withPlugins：给核心组件装上插件系统。
 *
 * 约定（Core 必须遵守，否则插件收不到事件）：
 *  1. Core 是 forwardRef 组件；
 *  2. Core 接收 `containerRefExternal` 并挂到根节点；
 *  3. Core 在挂载/卸载时调用 props.onMount / props.onUnmount；
 *  4. Core 把 props.children 原样渲染出来（插槽由 HOC 组装）。
 */
export function withPlugins<P extends AnyProps, R = any>(
  Component: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<R>
  >,
  config: WithPluginsConfig<P> | Plugin<P>[]
) {
  const options: WithPluginsConfig<P> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false, displayName } = options;

  const WithPluginsComponent = forwardRef<R, P>((props, ref) => {
    const runtime = usePluginRuntime<P>({ plugins, props, enableDebug });

    const enhancedProps: AnyProps = {
      ...runtime.transformProps(props),
      containerRefExternal: runtime.context.refs.container,
      debug: props.debug ?? enableDebug,

      onMount: () => {
        props.onMount?.();
        void runtime.execute("onMount", runtime.context);
      },
      onUnmount: () => {
        props.onUnmount?.();
        void runtime.execute("onUnmount", runtime.context);
      },
      onError: (error: Error, info?: React.ErrorInfo) => {
        props.onError?.(error, info);
        void runtime.execute("onError", runtime.context, error, info);
      },

      children: composeSlots(runtime.orderedPlugins, runtime.context, props.children),
    };

    return (
      <PluginRuntimeProvider runtime={runtime}>
        <Component ref={ref} {...(enhancedProps as P)} />
      </PluginRuntimeProvider>
    );
  });

  WithPluginsComponent.displayName =
    displayName ??
    `withPlugins(${Component.displayName ?? Component.name ?? "Component"})`;

  return WithPluginsComponent as React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<R>
  >;
}
