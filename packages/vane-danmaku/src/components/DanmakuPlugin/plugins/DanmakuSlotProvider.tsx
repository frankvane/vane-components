import React, { useMemo } from "react";
import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "./types";
import { SlotContext, type SlotContextValue } from "./slots";

/**
 * 弹幕 DOM 插槽提供者：把运行时排好序的插件 + 领域上下文下发给 Core，
 * 供 useDanmakuSlot 渲染 overlay / header / footer（控制面板 / 过滤开关 / 指令输入框等）。
 * 弹幕主体（飞行文字）由 canvas 内核绘制，这些 DOM 槽只承载交互控件。
 *
 * 单独成文件：slots 只放纯运行时逻辑，组件与 hook 分文件导出，
 * 避免 react-refresh 把「组件 + 函数」同文件视为不可热更新。
 */
export function DanmakuSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: DanmakuPlugin<unknown>[];
  context: DanmakuPluginContext<unknown>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
