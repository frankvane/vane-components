/**
 * 领域槽位（仿 vane-card D3-A · 包内 renderProfileSlot）
 *
 * 主页的「头图区 / 数据行 / 页签栏 / 认证区 / 关注区」是结构化段落，内核的
 * header / overlay / footer 三槽无法表达段落语义，因此这里提供包内领域槽。
 *
 * 与内核 composeSlots 保持同一套排序规则（config.order 升序 → priority 降序），
 * 单个插件渲染抛错只丢自己那一段（PluginErrorBoundary 隔离）。
 *
 * ProfileSlotProvider 把当前实例的 orderedPlugins 与领域上下文下发给 ProfileCore
 * 与内容区子组件（它们通过 useProfileSlot / useProfileContext 读取）。
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  ProfilePlugin,
  ProfilePluginContext,
  ProfileSlotName,
} from "./types";

interface SlotContextValue {
  orderedPlugins: ProfilePlugin<any>[];
  context: ProfilePluginContext<any>;
}

const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 由 withProfilePlugins 包在 WrappedComponent 外层，把当前实例的 orderedPlugins 与
 * 领域上下文下发给 ProfileCore 与内容区子组件。
 */
export function ProfileSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: ProfilePlugin<any>[];
  context: ProfilePluginContext<any>;
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
 */
export function renderProfileSlot(
  plugins: ProfilePlugin<any>[],
  context: ProfilePluginContext<any>,
  hookName: ProfileSlotName
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
        const node = (
          plugin.hooks as Record<
            string,
            (ctx: ProfilePluginContext<any>) => React.ReactNode
          >
        )[hookName](context);
        if (node === null || node === undefined) return null;
        // 每个插件单独一层错误边界：某个插件渲染期抛错只丢它自己
        return (
          <PluginErrorBoundary
            key={`profile-slot-${plugin.name}-${index}`}
          >
            {node}
          </PluginErrorBoundary>
        );
      } catch (error) {
        console.warn(
          `[vane-profile] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
          error
        );
        return null;
      }
    })
    .filter(Boolean) as React.ReactNode[];
}

/** 复合组件 / Core 读取某个领域槽位的所有片段 */
export function useProfileSlot(slot: ProfileSlotName): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  if (!ctx) return [];
  return renderProfileSlot(ctx.orderedPlugins, ctx.context, slot);
}

/**
 * 读取领域上下文（含 activeTab / stats / followState / verified 等）。
 * 内容区子组件通过它订阅 activeTab，以实现 TabSync 的「页签切换 → 内容区联动重渲染」。
 */
export function useProfileContext<T = any>(): ProfilePluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as ProfilePluginContext<T>) ?? null;
}
