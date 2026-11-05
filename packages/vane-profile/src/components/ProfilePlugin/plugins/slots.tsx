/**
 * 领域槽位（仿 vane-card D3-A · 包内 renderProfileSlot）
 *
 * 主页的「头图区 / 数据行 / 页签栏 / 认证区 / 关注区」是结构化段落，内核的
 * header / overlay / footer 三槽无法表达段落语义，因此这里提供包内领域槽。
 *
 * 与内核 composeSlots 保持同一套排序规则（config.order 升序 → priority 降序），
 * 单个插件渲染抛错只丢自己那一段（PluginErrorBoundary 隔离）。
 *
 * ProfileSlotProvider 组件在 ./ProfileSlotProvider.tsx：本文件只保留排序 / 渲染 /
 * 读取钩子等纯运行时逻辑（不含组件导出），以满足 react-refresh 的 Fast Refresh 约束。
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  ProfilePlugin,
  ProfilePluginContext,
  ProfileSlotName,
} from "./types";

/** 7 个领域槽（预分组只算一次，Core 只做 map） */
const SLOT_NAMES: ProfileSlotName[] = [
  "renderBannerArea",
  "renderBioArea",
  "renderStatRow",
  "renderTabBar",
  "renderBadgeArea",
  "renderFollowArea",
  "renderContentArea",
];

/**
 * 槽位层不关心 data 的具体形态，统一以 `unknown` 存取。
 * ProfilePlugin<T> → ProfilePlugin<unknown> 的赋值由钩子的方法语法双变兼容
 * （领域钩子声明用方法语法正是因为 strictFunctionTypes 下参数逆变）。
 */
type StoredPlugin = ProfilePlugin<unknown>;
type StoredContext = ProfilePluginContext<unknown>;

type SlotGroups<T = unknown> = Record<ProfileSlotName, ProfilePlugin<T>[]>;

export interface SlotContextValue {
  orderedPlugins: StoredPlugin[];
  context: StoredContext;
  /** 按槽预分组（已过滤未启用 / 未实现该钩子的插件，并完成排序） */
  slots: SlotGroups;
}

export const SlotContext = createContext<SlotContextValue | null>(null);

function sortByOrder<T>(plugins: ProfilePlugin<T>[]): ProfilePlugin<T>[] {
  return plugins.sort(
    (a, b) =>
      (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
      (b.priority ?? 0) - (a.priority ?? 0)
  );
}

/** 把插件按 7 个领域槽分组（过滤 + 排序一次完成） */
export function groupPluginsBySlot<T>(plugins: ProfilePlugin<T>[]): SlotGroups<T> {
  const groups = {} as SlotGroups<T>;
  for (const slot of SLOT_NAMES) {
    groups[slot] = sortByOrder(
      plugins.filter(
        (p) =>
          p.enabled !== false &&
          typeof (p.hooks as Record<string, unknown>)[slot] === "function"
      )
    );
  }
  return groups;
}

/** 渲染一个已分组的槽位列表（不重复排序 / 过滤） */
function renderSlotGroup<T>(
  plugins: ProfilePlugin<T>[],
  context: ProfilePluginContext<T>,
  hookName: ProfileSlotName
): React.ReactNode[] {
  return plugins.reduce<React.ReactNode[]>((acc, plugin) => {
    try {
      const node = (
        plugin.hooks as Record<
          string,
          (ctx: ProfilePluginContext<T>) => React.ReactNode
        >
      )[hookName](context);
      if (node === null || node === undefined) return acc;
      // 每个插件单独一层错误边界：某个插件渲染期抛错只丢它自己。
      // key 只用插件名：插件顺序变化（order/priority 调整、增删同槽插件）时
      // 不因 index 位移整颗重挂载，内部态（展开 / 乐观态）得以保留。
      acc.push(
        <PluginErrorBoundary key={`profile-slot-${plugin.name}`}>
          {node}
        </PluginErrorBoundary>
      );
      return acc;
    } catch (error) {
      console.warn(
        `[vane-profile] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
        error
      );
      return acc;
    }
  }, []);
}

/**
 * 渲染某个领域槽位的所有插件输出。
 * 排序：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 */
export function renderProfileSlot<T>(
  plugins: ProfilePlugin<T>[],
  context: ProfilePluginContext<T>,
  hookName: ProfileSlotName
): React.ReactNode[] {
  return renderSlotGroup(groupPluginsBySlot(plugins)[hookName], context, hookName);
}

/**
 * 复合组件 / Core 读取某个领域槽位的所有片段。
 * 结果按 [provider value, slot] memo：宿主重渲染但 props / context 未变时，
 * 插件渲染函数不会被重复调用。
 */
export function useProfileSlot(slot: ProfileSlotName): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  const plugins = ctx ? ctx.slots[slot] : null;
  const context = ctx ? ctx.context : null;
  return useMemo(
    () =>
      plugins && context ? renderSlotGroup(plugins, context, slot) : [],
    [plugins, context, slot]
  );
}

/**
 * 读取领域上下文（含 activeTab / stats / followState / verified 等）。
 * 内容区子组件通过它订阅 activeTab，以实现 TabSync 的「页签切换 → 内容区联动重渲染」。
 *
 * 泛型默认值保留 any（跨包契约位：第三方插件传入自定义 data 形态时
 * 不指定泛型不做约束，收紧为 unknown 会让既有调用方的属性访问 tsc 失败）。
 */
export function useProfileContext<T = any>(): ProfilePluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as unknown as ProfilePluginContext<T>) ?? null;
}
