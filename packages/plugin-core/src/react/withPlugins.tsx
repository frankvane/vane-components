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
    // forwardRef 的渲染签名是 PropsWithoutRef<P>，与 P 仅差 ref 字段，运行时一致；
    // 泛型 P 无法直接收敛，此处做边界断言，下游全部按 P 处理。
    const innerProps = props as P;
    const runtime = usePluginRuntime<P>({ plugins, props: innerProps, enableDebug });

    const enhancedProps: AnyProps = {
      ...runtime.transformProps(innerProps),
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
        {/* 泛型边界：enhancedProps 运行时形态确定，但 TS 无法静态验证到条件类型 PropsWithoutRef<P> */}
        <Component ref={ref} {...(enhancedProps as unknown as React.PropsWithoutRef<P>)} />
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
