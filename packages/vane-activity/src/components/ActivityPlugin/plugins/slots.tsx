/**
 * 活动领域槽位（仿 vane-comment 包内 renderActivitySlot）
 *
 * 活动渲染分「区域级」槽：头部横幅 / 顶部进度 / 任务清单 / 奖励领取 / 规则折叠 /
 * 底部社交，再加内核的浮层 overlay。内核的 header / overlay / footer 三槽只能表达
 * 全局叠加，无法表达「活动六个语义区块」，因此这里提供包内领域槽。
 *
 * 与内核 composeSlots 保持同一套排序规则（config.order 升序 → priority 降序），
 * 单个插件渲染抛错只丢自己那一段（PluginErrorBoundary 隔离）。
 *
 * ActivitySlotProvider 把当前实例的 orderedPlugins 与领域上下文下发给 ActivityCore
 * 与插件组件（它们通过 useActivitySlot / useActivityContext 读取）。
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type { Plugin } from "vane-plugin-core";
import type {
  ActivityCoreProps,
  ActivityData,
  ActivityPlugin,
  ActivityPluginContext,
  ActivitySlotName,
} from "./types";

interface SlotContextValue {
  orderedPlugins: ActivityPlugin<ActivityData>[];
  context: ActivityPluginContext<ActivityData>;
}

const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 由 withPlugins 包在 WrappedComponent 外层，下发 orderedPlugins 与领域上下文。
 */
export function ActivitySlotProvider<T = ActivityData>({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: Plugin<ActivityCoreProps<T>, T>[];
  context: ActivityPluginContext<T>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({
      // 泛型插件集合在槽位层统一按默认领域数据渲染；渲染只读 hooks + 排序字段。
      orderedPlugins: orderedPlugins as unknown as ActivityPlugin<ActivityData>[],
      context: context as unknown as ActivityPluginContext<ActivityData>,
    }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

/**
 * 每个 plugins 数组的「槽位 → 已排序候选插件」缓存。
 * orderedPlugins 数组引用由内核 useMemo 固定，故以它作 WeakMap key 不会泄漏。
 */
const slotCache = new WeakMap<
  ActivityPlugin<ActivityData>[],
  Map<ActivitySlotName, ActivityPlugin<ActivityData>[]>
>();

function resolveSlotPlugins(
  plugins: ActivityPlugin<ActivityData>[],
  slot: ActivitySlotName
): ActivityPlugin<ActivityData>[] {
  let perHook = slotCache.get(plugins);
  if (!perHook) {
    perHook = new Map();
    slotCache.set(plugins, perHook);
  }
  let resolved = perHook.get(slot);
  if (!resolved) {
    resolved = [...plugins]
      .filter(
        (p) => typeof (p.hooks as Record<string, unknown>)[slot] === "function"
      )
      .sort(
        (a, b) =>
          (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
          (b.priority ?? 0) - (a.priority ?? 0)
      );
    perHook.set(slot, resolved);
  }
  return resolved;
}

/**
 * 渲染某个领域槽位的所有插件输出。
 * 排序：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 */
export function renderActivitySlot(
  plugins: ActivityPlugin<ActivityData>[],
  context: ActivityPluginContext<ActivityData>,
  slot: ActivitySlotName
): React.ReactNode[] {
  return resolveSlotPlugins(plugins, slot)
    .map((plugin, index) => {
      if (plugin.enabled === false) return null;
      try {
        const fn = (
          plugin.hooks as Record<
            string,
            (ctx: ActivityPluginContext<ActivityData>) => React.ReactNode
          >
        )[slot];
        const node = fn(context);
        if (node === null || node === undefined) return null;
        return (
          <PluginErrorBoundary
            key={`activity-slot-${plugin.name}-${index}`}
          >
            {node}
          </PluginErrorBoundary>
        );
      } catch (error) {
        console.warn(
          `[vane-activity] 插件 ${plugin.name} 的 ${slot} 渲染失败`,
          error
        );
        return null;
      }
    })
    .filter(Boolean) as React.ReactNode[];
}

/** 复合组件 / Core 读取某个领域槽位的所有片段 */
export function useActivitySlot(slot: ActivitySlotName): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  if (!ctx) return [];
  return renderActivitySlot(ctx.orderedPlugins, ctx.context, slot);
}

/**
 * 读取活动领域上下文（含 tasks / rewards / progress / claimedIds / claim 等）。
 * 插件组件通过它订阅派生数据，以实现领取后奖励状态重渲染。
 */
export function useActivityContext<T = ActivityData>(): ActivityPluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as ActivityPluginContext<T>) ?? null;
}
