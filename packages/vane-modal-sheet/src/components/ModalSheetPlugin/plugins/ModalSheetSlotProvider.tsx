import React, { useMemo } from "react";
import type { ModalSheetPlugin, ModalSheetPluginContext } from "./types";
import { SlotContext, type SlotContextValue } from "./slots";

/**
 * 弹层 DOM 插槽提供者：把运行时排好序的插件 + 领域上下文下发给 Core，
 * 供 useModalSheetSlot 渲染 backdrop / handle / header / footer / overlay。
 * 面板的 transform / 高度由内核引擎独占，槽位只承载各插件自己的视觉件。
 *
 * 单独成文件：slots 只放纯运行时逻辑，组件与 hook 分文件导出，
 * 避免 react-refresh 把「组件 + 函数」同文件视为不可热更新。
 */
export function ModalSheetSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: ModalSheetPlugin[];
  context: ModalSheetPluginContext;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return (
    <SlotContext.Provider value={value}>{children}</SlotContext.Provider>
  );
}
