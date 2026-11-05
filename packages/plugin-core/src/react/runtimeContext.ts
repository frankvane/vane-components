import { createContext, useContext } from "react";
import type { PluginRuntime } from "./usePluginRuntime";

/**
 * 运行时上下文：存储侧类型擦除为 unknown（实例的实际泛型由取用侧决定），
 * 避免用 any 破坏类型检查；取用侧按自己的 TProps / TData 断言。
 */
export const RuntimeContext = createContext<unknown>(null);

/** 取当前宿主组件的插件运行时（插件组件里最常用） */
export function usePluginRuntimeFromContext<
  TProps = unknown,
  TData = unknown,
>(): PluginRuntime<TProps, TData> {
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
  return usePluginRuntimeFromContext().bus;
}

/** 取当前实例的插件上下文 */
export function usePluginContext<TProps = unknown, TData = unknown>() {
  return usePluginRuntimeFromContext<TProps, TData>().context;
}
