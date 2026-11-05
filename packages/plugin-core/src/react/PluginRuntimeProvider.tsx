import React from "react";
import { RuntimeContext } from "./runtimeContext";
import type { PluginRuntime } from "./usePluginRuntime";

/**
 * 运行时 Provider：只负责把当前实例的 runtime 放进上下文。
 * 读取侧的 hook（useRuntime / usePluginBus / usePluginContext）放在
 * runtimeContext.ts，避免本文件同时导出组件与非组件触发 react-refresh 告警。
 */
export function PluginRuntimeProvider<TProps, TData>({
  runtime,
  children,
}: {
  runtime: PluginRuntime<TProps, TData>;
  children: React.ReactNode;
}) {
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}
