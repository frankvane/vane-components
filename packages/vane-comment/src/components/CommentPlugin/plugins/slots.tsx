/**
 * 领域槽位（仿 vane-profile 包内 renderCommentSlot）
 *
 * 评论区渲染分「列表级」与「逐条级」两类。内核的 header / overlay / footer 三槽
 * 只能表达全局叠加，无法表达「逐条评论的操作行 / 楼中楼」。因此这里提供包内领域槽，
 * 并支持把当前评论作为第二参数（payload）传给逐条钩子。
 *
 * 与内核 composeSlots 保持同一套排序规则（config.order 升序 → priority 降序），
 * 单个插件渲染抛错只丢自己那一段（PluginErrorBoundary 隔离）。
 *
 * CommentSlotProvider 把当前实例的 orderedPlugins 与领域上下文下发给 CommentCore
 * 与评论子组件（它们通过 useCommentSlot / useCommentContext 读取）。
 *
 * 本文件只导出组件（CommentSlotProvider），槽上下文与渲染函数在 slotContext.ts，
 * 以满足 react-refresh「文件只导出组件」的约束。
 */

import React, { useMemo } from "react";
import { SlotContext } from "./slotContext";
import type { SlotContextValue } from "./slotContext";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
} from "./types";

/**
 * 由 withCommentPlugins 包在 WrappedComponent 外层，下发 orderedPlugins 与领域上下文。
 */
export function CommentSlotProvider<T = CommentData>({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: CommentPlugin<T>[];
  context: CommentPluginContext<T>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () =>
      ({
        orderedPlugins,
        context,
      }) as unknown as SlotContextValue,
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
