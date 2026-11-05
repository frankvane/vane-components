/**
 * 领域槽位（仿 vane-resume 的 ResumeSlotProvider，扩展 per-card / per-stage 双参槽）。
 *
 * 三类槽：
 *  - 全局装饰累积槽（renderToolbar / renderFooter）：多插件输出顺序拼接。
 *  - per-card / per-stage 装饰累积槽（renderCardBadges / renderCardActions /
 *    renderColumnHeader）：多插件输出顺序拼接，钩子签名带 candidate / stage 参数。
 *  - 内容覆盖槽（renderCards / renderCardBody）：单值语义——最高 priority 且返回
 *    非 null 的插件胜出，否则由核心渲染默认结构。
 *
 * 排序规则与内核一致：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 * CandidateSlotProvider 把当前实例的 orderedPlugins 与领域上下文下发给 CandidateCore。
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePlugin,
  CandidatePluginContext,
  CandidateSlotName,
  StageConfig,
} from "./types";
import { DECORATIVE_SLOTS } from "./types";

export type AnyCandidatePlugin = CandidatePlugin<Candidate>;
export type AnyContext = CandidatePluginContext<Candidate>;
type GlobalSlots = Pick<SlotGroups, "renderToolbar" | "renderFooter">;
type SlotGroups = Partial<Record<CandidateSlotName, AnyCandidatePlugin[]>>;

export interface SlotContextValue {
  orderedPlugins: AnyCandidatePlugin[];
  context: AnyContext;
  slots: SlotGroups;
}

export const SlotContext = createContext<SlotContextValue | null>(null);

function sortByOrder(plugins: AnyCandidatePlugin[]): AnyCandidatePlugin[] {
  return [...plugins].sort(
    (a, b) =>
      (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
      (b.priority ?? 0) - (a.priority ?? 0)
  );
}

/** 把实现装饰槽钩子的插件按槽预分组（过滤 + 排序一次完成） */
export function groupPluginsBySlot(plugins: AnyCandidatePlugin[]): SlotGroups {
  const groups: SlotGroups = {};
  for (const slot of DECORATIVE_SLOTS) {
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

/** 逐插件调用装饰槽钩子并拼接输出，单插件抛错只丢自己那一段 */
function renderSlotGroup(
  plugins: AnyCandidatePlugin[],
  context: AnyContext,
  hookName: CandidateSlotName,
  ...extraArgs: unknown[]
): React.ReactNode[] {
  return plugins.reduce<React.ReactNode[]>((acc, plugin) => {
    try {
      const node = (
        plugin.hooks as Record<
          string,
          (ctx: AnyContext, ...rest: unknown[]) => React.ReactNode
        >
      )[hookName](context, ...extraArgs);
      if (node === null || node === undefined) return acc;
      acc.push(
        <PluginErrorBoundary key={`vcd-slot-${plugin.name}`}>
          {node}
        </PluginErrorBoundary>
      );
      return acc;
    } catch (error) {
      console.warn(`[vane-candidate] 插件 ${plugin.name} 的 ${hookName} 渲染失败`, error);
      return acc;
    }
  }, []);
}

/** 渲染某个装饰累积槽的所有插件输出（现场分组，供命令式场景使用） */
export function renderCandidateSlot(
  plugins: AnyCandidatePlugin[],
  context: AnyContext,
  hookName: CandidateSlotName,
  ...extraArgs: unknown[]
): React.ReactNode[] {
  return renderSlotGroup(
    groupPluginsBySlot(plugins)[hookName] ?? [],
    context,
    hookName,
    ...extraArgs
  );
}

/** fallback 支持惰性工厂：无插件覆盖时才会创建默认节点 */
export type ContentFallback =
  | React.ReactNode
  | ((...args: unknown[]) => React.ReactNode);

function resolveFallback(fallback: ContentFallback, args: unknown[]): React.ReactNode {
  return typeof fallback === "function"
    ? (fallback as (...a: unknown[]) => React.ReactNode)(...args)
    : fallback;
}

/**
 * 内容覆盖槽解析：在实现了该钩子的插件中，取 priority 最高且返回非 null 者胜出；
 * 若无任何插件返回非 null，才调用 fallback 生成核心默认结构。
 */
export function resolveCandidateContentSlot(
  plugins: AnyCandidatePlugin[],
  context: AnyContext,
  hookName: "renderCards" | "renderCardBody",
  fallback: ContentFallback,
  ...extraArgs: unknown[]
): React.ReactNode {
  const candidates = sortByOrder(
    plugins.filter(
      (p) =>
        p.enabled !== false &&
        typeof (p.hooks as Record<string, unknown>)[hookName] === "function"
    )
  );
  // sortByOrder 末尾是最高 priority；倒序取首个非 null
  for (let i = candidates.length - 1; i >= 0; i--) {
    const plugin = candidates[i];
    try {
      const node = (
        plugin.hooks as Record<
          string,
          (ctx: AnyContext, ...rest: unknown[]) => React.ReactNode
        >
      )[hookName](context, ...extraArgs);
      if (node !== null && node !== undefined) {
        return (
          <PluginErrorBoundary key={`vcd-content-${plugin.name}`}>
            {node}
          </PluginErrorBoundary>
        );
      }
    } catch (error) {
      console.warn(
        `[vane-candidate] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
        error
      );
    }
  }
  return resolveFallback(fallback, extraArgs);
}

/** 读取全局装饰累积槽（toolbar / footer）的所有片段 */
export function useCandidateSlot(slot: "renderToolbar" | "renderFooter"): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  const plugins = ctx ? ctx.slots[slot] : null;
  const context = ctx ? ctx.context : null;
  return useMemo(
    () => (plugins && context ? renderSlotGroup(plugins, context, slot) : []),
    [plugins, context, slot]
  );
}

/** 读取 per-card / per-stage 装饰槽（每次渲染现算；卡片数量有限，开销可忽略） */
export function useCandidateCardSlot(
  slot: "renderCardBadges" | "renderCardActions",
  candidate: Candidate
): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  const plugins = ctx ? ctx.slots[slot] : null;
  const context = ctx ? ctx.context : null;
  return useMemo(
    () => (plugins && context ? renderSlotGroup(plugins, context, slot, candidate) : []),
    [plugins, context, slot, candidate]
  );
}

export function useCandidateColumnSlot(
  slot: "renderColumnHeader",
  stage: StageConfig,
  count: number
): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  const plugins = ctx ? ctx.slots[slot] : null;
  const context = ctx ? ctx.context : null;
  return useMemo(
    () => (plugins && context ? renderSlotGroup(plugins, context, slot, stage, count) : []),
    [plugins, context, slot, stage, count]
  );
}

/** 内容覆盖槽（单值；fallback 为核心默认结构，推荐传惰性工厂） */
export function useCandidateContentSlot(
  slot: "renderCards" | "renderCardBody",
  fallback: ContentFallback,
  ...extraArgs: unknown[]
): React.ReactNode {
  const slotCtx = useContext(SlotContext);
  const orderedPlugins = slotCtx ? slotCtx.orderedPlugins : null;
  const context = slotCtx ? slotCtx.context : null;
  return useMemo(
    () =>
      orderedPlugins && context
        ? resolveCandidateContentSlot(orderedPlugins, context, slot, fallback, ...extraArgs)
        : resolveFallback(fallback, extraArgs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedPlugins, context, slot, ...extraArgs]
  );
}

/** 读取领域上下文（含 transformData 后的 data、state、setState、bus、forceUpdate…） */
export function useCandidateContext<T = Candidate>(): CandidatePluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as unknown as CandidatePluginContext<T>) ?? null;
}

export type { GlobalSlots };
