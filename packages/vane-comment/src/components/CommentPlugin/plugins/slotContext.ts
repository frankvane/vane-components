/**
 * 领域槽位的运行时实现（排序缓存 / 渲染 / 读取钩子）。
 *
 * 从 slots.tsx 拆出：slots.tsx 只保留 CommentSlotProvider 组件，
 * 使该文件「只导出组件」以满足 react-refresh 的 Fast Refresh 约束；
 * 槽上下文与渲染函数是纯运行时逻辑，放在本模块（不导出组件）。
 */

import React, { createContext, useContext } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  CommentSlotName,
} from "./types";

export interface SlotContextValue {
  orderedPlugins: CommentPlugin<CommentData>[];
  context: CommentPluginContext<CommentData>;
}

export const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 每个 plugins 数组的「槽位 → 已排序候选插件」缓存。
 * orderedPlugins 数组引用由内核 useMemo 固定，故以它作 WeakMap key 不会泄漏；
 * 逐条槽以前每次都要 `[...plugins].filter().sort()`，N 条评论 × 2 槽 × 17 插件时
 * 排序开销随列表长度线性放大，这里缓存掉排序结果（enabled 仍在每次调用时判断，
 * 保留运行时启停语义）。
 */
const slotCache = new WeakMap<
  object,
  Map<CommentSlotName, CommentPlugin<CommentData>[]>
>();

function resolveSlotPlugins<T>(
  plugins: CommentPlugin<T>[],
  hookName: CommentSlotName
): CommentPlugin<T>[] {
  let perHook = slotCache.get(plugins);
  if (!perHook) {
    perHook = new Map();
    slotCache.set(plugins, perHook);
  }
  let resolved = perHook.get(hookName) as CommentPlugin<T>[] | undefined;
  if (!resolved) {
    resolved = [...plugins]
      .filter(
        (p) =>
          typeof (p.hooks as unknown as Record<string, unknown>)[hookName] ===
          "function"
      )
      .sort(
        (a, b) =>
          (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
          (b.priority ?? 0) - (a.priority ?? 0)
      );
    perHook.set(hookName, resolved as unknown as CommentPlugin<CommentData>[]);
  }
  return resolved;
}

/**
 * 渲染某个领域槽位的所有插件输出。
 * 排序：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 * 逐条槽（renderCommentActions / renderNested）把 payload（当前评论）作为第二参数。
 */
export function renderCommentSlot<T = CommentData>(
  plugins: CommentPlugin<T>[],
  context: CommentPluginContext<T>,
  hookName: CommentSlotName,
  payload?: unknown
): React.ReactNode[] {
  return resolveSlotPlugins(plugins, hookName)
    .map((plugin, index) => {
      if (plugin.enabled === false) return null;
      try {
        const fn = (
          plugin.hooks as unknown as Record<
            string,
            (ctx: CommentPluginContext<T>, p?: unknown) => React.ReactNode
          >
        )[hookName];
        const node = payload !== undefined ? fn(context, payload) : fn(context);
        if (node === null || node === undefined) return null;
        return React.createElement(
          PluginErrorBoundary,
          { key: `comment-slot-${plugin.name}-${index}`, children: node }
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
 *
 * 泛型默认值保留 any（跨包契约位：第三方插件传入自定义 data 形态时
 * 不指定泛型不做约束，收紧为 CommentData 会让既有调用方 tsc 失败）。
 */
export function useCommentContext<T = any>(): CommentPluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as unknown as CommentPluginContext<T>) ?? null;
}
