import React, { useMemo } from "react";
import type { ProfilePlugin, ProfilePluginContext } from "./types";
import { SlotContext, groupPluginsBySlot } from "./slots";
import type { SlotContextValue } from "./slots";

/**
 * 由 withProfilePlugins 包在 WrappedComponent 外层，把当前实例的 orderedPlugins 与
 * 领域上下文下发给 ProfileCore 与内容区子组件。
 *
 * 单独成文件（而不是与 slots.tsx 同文件）：本文件只导出组件，slots.tsx 只导出
 * 运行时函数 / 钩子，二者各自满足 react-refresh 的 Fast Refresh 约束。
 *
 * props 统一以 `unknown` 承载 data 泛型：槽位层只做排序、调用与上下文下发，
 * 不消费 data 的具体形态；具体泛型由 withPlugins 的 T 在领域钩子内携带。
 * `unknown` 比 `any` 更严格（调用方必须显式收窄），对宿主装配调用为等价收紧。
 */
export function ProfileSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: ProfilePlugin<unknown>[];
  context: ProfilePluginContext<unknown>;
  children: React.ReactNode;
}) {
  const slots = useMemo(() => groupPluginsBySlot(orderedPlugins), [orderedPlugins]);
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context, slots }),
    [orderedPlugins, context, slots]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
