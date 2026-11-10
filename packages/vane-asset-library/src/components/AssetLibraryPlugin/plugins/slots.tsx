/* eslint-disable react-refresh/only-export-components -- 槽位组装是纯函数集合（含 PluginErrorBoundary 包裹的 JSX）；库产物不走应用层 HMR */
import React from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  AssetItem,
  AssetPlugin,
  AssetLibraryContext,
  AssetSlots,
  DecorativeSlot,
} from "./types";
import { DECORATIVE_SLOTS } from "./types";

/**
 * 领域槽位组装。
 *
 * 三类语义：
 *  - 装饰累积槽（dropzone / toolbar / footer / overlay / per-card 三槽）：多插件输出按顺序拼接；
 *  - 单值槽（empty）：最高 priority 且返回非 null 的插件胜出，否则交回 Core 走兜底文案；
 *  - per-card 槽：钩子签名多两个参数 (item, index)，由 Core 逐卡片调用。
 *
 * 排序规则与内核一致：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 * 单个插件抛错只丢自己那一段，其余插件照常渲染。
 */

export const GROUP_SLOTS = [...DECORATIVE_SLOTS, "renderEmpty"] as const;
export type GroupSlot = (typeof GROUP_SLOTS)[number];
export type SlotGroups = Partial<Record<GroupSlot, AssetPlugin[]>>;

function sortByOrder(plugins: AssetPlugin[]): AssetPlugin[] {
  return [...plugins].sort(
    (a, b) =>
      (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
      (b.priority ?? 0) - (a.priority ?? 0)
  );
}

/** 按槽预分组：过滤 + 排序一次完成，供渲染期直接取用 */
export function groupPluginsBySlot(plugins: AssetPlugin[]): SlotGroups {
  const groups: SlotGroups = {};
  for (const slot of GROUP_SLOTS) {
    groups[slot] = sortByOrder(
      plugins.filter(
        (plugin) =>
          plugin.enabled !== false &&
          typeof (plugin.hooks as Record<string, unknown>)[slot] === "function"
      )
    );
  }
  return groups;
}

type SlotFn = (
  context: AssetLibraryContext,
  ...rest: unknown[]
) => React.ReactNode;

/** 逐插件调用槽钩子并拼接输出 */
export function renderSlotGroup(
  plugins: AssetPlugin[],
  context: AssetLibraryContext,
  hookName: DecorativeSlot,
  ...extraArgs: unknown[]
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  for (const plugin of plugins) {
    const fn = (plugin.hooks as Record<string, SlotFn | undefined>)[hookName];
    if (typeof fn !== "function") continue;
    try {
      const node = fn(context, ...extraArgs);
      if (node === null || node === undefined || node === false) continue;
      nodes.push(
        <PluginErrorBoundary key={`val-${hookName}-${plugin.name}`}>
          {node}
        </PluginErrorBoundary>
      );
    } catch (error) {
      console.warn(
        `[vane-asset-library] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
        error
      );
    }
  }
  return nodes;
}

/** 单值槽：从最高 priority 起找第一个返回非 null 的插件 */
function resolveSingleSlot(
  plugins: AssetPlugin[],
  context: AssetLibraryContext,
  reason: "empty" | "filtered"
): React.ReactNode[] {
  for (let i = plugins.length - 1; i >= 0; i -= 1) {
    const plugin = plugins[i];
    const fn = (plugin.hooks as Record<string, unknown>).renderEmpty as
      | ((ctx: AssetLibraryContext, reason: "empty" | "filtered") => React.ReactNode)
      | undefined;
    if (typeof fn !== "function") continue;
    try {
      const node = fn(context, reason);
      if (node === null || node === undefined || node === false) continue;
      return [
        <PluginErrorBoundary key={`val-empty-${plugin.name}`}>{node}</PluginErrorBoundary>,
      ];
    } catch (error) {
      console.warn(
        `[vane-asset-library] 插件 ${plugin.name} 的 renderEmpty 渲染失败`,
        error
      );
    }
  }
  return [];
}

/**
 * 组装注入 Core 的槽对象。
 * per-card 三槽做成闭包：Core 逐卡片调用，插件拿到 (context, item, index)。
 */
export function buildAssetSlots(
  plugins: AssetPlugin[],
  context: AssetLibraryContext,
  emptyReason: "empty" | "filtered" | null
): AssetSlots {
  const groups = groupPluginsBySlot(plugins);
  const cardSlot =
    (hook: "renderCardOverlay" | "renderCardActions" | "renderCardMeta") =>
    (item: AssetItem, index: number): React.ReactNode[] =>
      renderSlotGroup(groups[hook] ?? [], context, hook, item, index);

  return {
    dropzone: renderSlotGroup(groups.renderDropzone ?? [], context, "renderDropzone"),
    toolbar: renderSlotGroup(groups.renderToolbar ?? [], context, "renderToolbar"),
    footer: renderSlotGroup(groups.renderFooter ?? [], context, "renderFooter"),
    overlay: renderSlotGroup(groups.renderOverlay ?? [], context, "renderOverlay"),
    empty: emptyReason
      ? resolveSingleSlot(groups.renderEmpty ?? [], context, emptyReason)
      : [],
    cardOverlay: cardSlot("renderCardOverlay"),
    cardActions: cardSlot("renderCardActions"),
    cardMeta: cardSlot("renderCardMeta"),
  };
}
