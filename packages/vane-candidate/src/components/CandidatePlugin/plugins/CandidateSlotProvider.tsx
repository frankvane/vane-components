import React, { useMemo } from "react";
import {
  SlotContext,
  groupPluginsBySlot,
  type SlotContextValue,
  type AnyCandidatePlugin,
  type AnyContext,
} from "./slots";

/**
 * 由 withCandidatePlugins 包在 WrappedComponent 外层，把当前实例的 orderedPlugins 与
 * 领域上下文下发给 CandidateCore。
 *
 * 单独成文件：slots 只放纯运行时逻辑，组件与 hook 分文件导出，
 * 避免 react-refresh 把「组件 + 函数」同文件视为不可热更新。
 */
export function CandidateSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: AnyCandidatePlugin[];
  context: AnyContext;
  children: React.ReactNode;
}) {
  const slots = useMemo(() => groupPluginsBySlot(orderedPlugins), [orderedPlugins]);
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context, slots }),
    [orderedPlugins, context, slots]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
