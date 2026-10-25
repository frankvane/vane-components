import React, { createContext, useContext } from "react";
import type { PluginRuntime } from "./usePluginRuntime";

const RuntimeContext = createContext<PluginRuntime<any, any> | null>(null);

export function PluginRuntimeProvider({
  runtime,
  children,
}: {
  runtime: PluginRuntime<any, any>;
  children: React.ReactNode;
}) {
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

/** 取当前宿主组件的插件运行时（插件组件里最常用） */
export function usePluginRuntime<TProps = any, TData = any>(): PluginRuntime<TProps, TData> {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error(
      "[vane/plugin-core] usePluginRuntime 必须在 withPlugins 包装的组件内部使用"
    );
  }
  return runtime as PluginRuntime<TProps, TData>;
}

/** 取当前实例的事件总线 */
export function usePluginBus() {
  return usePluginRuntime().bus;
}

/** 取当前实例的插件上下文 */
export function usePluginContext<TProps = any, TData = any>() {
  return usePluginRuntime<TProps, TData>().context;
}
