import React, { useMemo } from "react";
import type { ResumePlugin, ResumePluginContext } from "./types";
import { SlotContext, groupPluginsBySlot, type SlotContextValue } from "./slots";

/**
 * 由 withResumePlugins 包在 WrappedComponent 外层，把当前实例的 orderedPlugins 与
 * 领域上下文下发给 ResumeCore 与子组件。
 *
 * 单独成文件：slots 只放纯运行时逻辑，组件与 hook 分文件导出，
 * 避免 react-refresh 把「组件 + 函数」同文件视为不可热更新。
 */
export function ResumeSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: ResumePlugin<unknown>[];
  context: ResumePluginContext<unknown>;
  children: React.ReactNode;
}) {
  const slots = useMemo(() => groupPluginsBySlot(orderedPlugins), [orderedPlugins]);
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context, slots }),
    [orderedPlugins, context, slots]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
