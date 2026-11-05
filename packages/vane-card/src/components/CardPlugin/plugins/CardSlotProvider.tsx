/**
 * 领域槽位 Provider（只导出组件，保证 react-refresh 可用）
 *
 * 槽位上下文本身与读取 hooks 都在 slots.tsx（纯运行时逻辑），这里只负责把
 * withPlugins 传入的 orderedPlugins / 领域上下文下发成 React context。
 */

import React, { useMemo } from "react";
import { SlotContext, type SlotContextValue } from "./slots";
import type { CardPlugin, CardPluginContext } from "./types";

/**
 * 由 withPlugins 包在 WrappedComponent 外层，把当前实例的 orderedPlugins 与
 * 领域上下文下发给所有复合组件（它们通过 usePluginSlot 读价格区片段）。
 */
export function CardSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: CardPlugin<unknown>[];
  context: CardPluginContext<unknown>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
