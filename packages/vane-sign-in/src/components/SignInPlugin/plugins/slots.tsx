/**
 * 领域槽位（仿 vane-profile 包内 renderProfileSlot）。
 *
 * 签到的「头部 / 日历 / 奖励 / 操作 / 底部」是结构化段落，内核 header / overlay /
 * footer 三槽无法表达段落语义，故提供包内领域槽。与内核 composeSlots 同一排序规则
 * （config.order 升序 → priority 降序），单个插件渲染抛错只丢自己那一段。
 *
 * 性能约定：
 *  - 插件按槽预先分组并排序（Provider 内 useMemo 一次），避免每次渲染都跑 5 次
 *    filter + sort；
 *  - 槽位产物按 [分组, context, slot] memo，context 稳定时父级空 setState 不会
 *    重跑插件钩子；
 *  - slot key 只用 plugin.name：调整 order / priority 或增删同槽插件时，
 *    带内部状态的插件（Remind / RuleExpand）不会因 index 位移被重挂载而丢状态。
 *
 * SignInSlotProvider 组件在 ./SignInSlotProvider.tsx：本文件只保留分组 / 渲染 /
 * 读取钩子等纯运行时逻辑（不含组件导出），以满足 react-refresh 的 Fast Refresh 约束。
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  SignInPlugin,
  SignInPluginContext,
  SignInSlotName,
} from "./types";

const SLOT_NAMES: SignInSlotName[] = [
  "renderHeader",
  "renderCalendar",
  "renderRewards",
  "renderActions",
  "renderFooter",
];

/**
 * 槽位层不关心 data 的具体形态，统一以 `unknown` 存取。
 * 此处 SignInPluginContext 的泛型 T 不参与 data 形态（data 恒为 SignInData），
 * 因此 <T> → <unknown> 的赋值双向兼容。
 */
type StoredContext = SignInPluginContext<unknown>;
type SlotGroups<T = unknown> = Record<SignInSlotName, SignInPlugin<T>[]>;

const EMPTY_SLOT: React.ReactNode[] = [];

export interface SlotContextValue {
  groups: SlotGroups;
  context: StoredContext;
}

export const SlotContext = createContext<SlotContextValue | null>(null);

function sortPlugins<T>(a: SignInPlugin<T>, b: SignInPlugin<T>): number {
  return (
    (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
    (b.priority ?? 0) - (a.priority ?? 0)
  );
}

/** 按槽分组 + 排序（每个插件只在 provider 挂载/插件集变化时做一次） */
export function groupPluginsBySlot<T>(
  plugins: SignInPlugin<T>[]
): SlotGroups<T> {
  const groups: SlotGroups<T> = {
    renderHeader: [],
    renderCalendar: [],
    renderRewards: [],
    renderActions: [],
    renderFooter: [],
  };
  for (const plugin of plugins) {
    if (plugin.enabled === false) continue;
    for (const slot of SLOT_NAMES) {
      if (
        typeof (plugin.hooks as Record<string, unknown> | undefined)?.[slot] ===
        "function"
      ) {
        groups[slot].push(plugin);
      }
    }
  }
  for (const slot of SLOT_NAMES) groups[slot].sort(sortPlugins);
  return groups;
}

function renderPluginGroup<T>(
  plugins: SignInPlugin<T>[],
  context: SignInPluginContext<T>,
  hookName: SignInSlotName
): React.ReactNode[] {
  return plugins.map((plugin) => {
    try {
      const node = (
        plugin.hooks as Record<
          string,
          (ctx: SignInPluginContext<T>) => React.ReactNode
        >
      )[hookName](context);
      if (node === null || node === undefined) return null;
      return (
        <PluginErrorBoundary key={`signin-slot-${plugin.name}`}>
          {node}
        </PluginErrorBoundary>
      );
    } catch (error) {
      console.warn(
        `[vane-sign-in] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
        error
      );
      return null;
    }
  });
}

/** 兼容旧调用：给定插件集合，按槽分组/排序后渲染（未走 Provider 缓存） */
export function renderSignInSlot<T>(
  plugins: SignInPlugin<T>[],
  context: SignInPluginContext<T>,
  hookName: SignInSlotName
): React.ReactNode[] {
  const grouped = groupPluginsBySlot(plugins)[hookName];
  return grouped.length ? renderPluginGroup(grouped, context, hookName) : [];
}

/** Core 读取某个领域槽位的所有片段（context 稳定时命中 memo，不重跑插件钩子） */
export function useSignInSlot(slot: SignInSlotName): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  const group = ctx?.groups[slot];
  const context = ctx?.context;
  return useMemo(() => {
    if (!group || !context) return EMPTY_SLOT;
    const nodes = renderPluginGroup(group, context, slot);
    return nodes.length ? nodes : EMPTY_SLOT;
  }, [group, context, slot]);
}

/**
 * 子组件读取领域上下文（含 data / callbacks）。
 *
 * 泛型默认值保留 any（跨包契约位：与 SignInPluginContext 的泛型位一致，第三方
 * 插件以自定义 T 调用时不做约束；收紧为 unknown 会让既有调用方的属性访问 tsc 失败）。
 */
export function useSignInContext<T = any>(): SignInPluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as unknown as SignInPluginContext<T>) ?? null;
}
