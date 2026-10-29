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
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  CommentPlugin,
  CommentPluginContext,
  CommentSlotName,
} from "./types";

interface SlotContextValue {
  orderedPlugins: CommentPlugin<any>[];
  context: CommentPluginContext<any>;
}

const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 由 withCommentPlugins 包在 WrappedComponent 外层，下发 orderedPlugins 与领域上下文。
 */
export function CommentSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: CommentPlugin<any>[];
  context: CommentPluginContext<any>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

/**
 * 渲染某个领域槽位的所有插件输出。
 * 排序：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 * 逐条槽（renderCommentActions / renderNested）把 payload（当前评论）作为第二参数。
 */
export function renderCommentSlot(
  plugins: CommentPlugin<any>[],
  context: CommentPluginContext<any>,
  hookName: CommentSlotName,
  payload?: unknown
): React.ReactNode[] {
  return [...plugins]
    .filter(
      (p) =>
        p.enabled !== false &&
        typeof (p.hooks as Record<string, unknown>)[hookName] === "function"
    )
    .sort(
      (a, b) =>
        (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
        (b.priority ?? 0) - (a.priority ?? 0)
    )
    .map((plugin, index) => {
      try {
        const fn = (plugin.hooks as Record<string, (ctx: any, p?: any) => React.ReactNode>)[
          hookName
        ];
        const node = payload !== undefined ? fn(context, payload) : fn(context);
        if (node === null || node === undefined) return null;
        return (
          <PluginErrorBoundary
            key={`comment-slot-${plugin.name}-${index}`}
          >
            {node}
          </PluginErrorBoundary>
        );
      } catch (error) {
        console.warn(
          `[vane-comment] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
          error
        );
        return null;
      }
    })
    .filter(Boolean) as React.ReactNode[];
}

/** 复合组件 / Core 读取某个领域槽位的所有片段（可传 payload 给逐条槽） */
export function useCommentSlot(
  slot: CommentSlotName,
  payload?: unknown
): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  if (!ctx) return [];
  return renderCommentSlot(ctx.orderedPlugins, ctx.context, slot, payload);
}

/**
 * 读取领域上下文（含 comments / sortMode / setSortMode 等）。
 * 评论子组件通过它订阅 comments，以实现排序变化后的列表重渲染。
 */
export function useCommentContext<T = any>(): CommentPluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as CommentPluginContext<T>) ?? null;
}
