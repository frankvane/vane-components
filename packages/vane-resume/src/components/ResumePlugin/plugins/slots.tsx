/**
 * 领域槽位（仿 vane-profile 的 renderProfileSlot，扩展「内容覆盖」语义）。
 *
 * 两类槽：
 *  - 装饰累积槽（renderToolbar / renderBasics / renderAttachments / renderFooter）：
 *    多插件输出顺序拼接，单个插件渲染失败只丢自己那一段。
 *  - 内容覆盖槽（renderWork / renderEducation / renderSkills / renderProjects / renderExtra）：
 *    最高 priority 且返回非 null 的插件胜出，否则由核心渲染默认结构。
 *
 * 排序规则与内核一致：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 * ResumeSlotProvider（见同目录 ResumeSlotProvider.tsx）把当前实例的 orderedPlugins
 * 与领域上下文下发给 ResumeCore 与内容区子组件（它们通过 useResumeSlot /
 * useResumeContext 读取）。
 */

import React, { createContext, useContext, useMemo, useRef } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  ResumePlugin,
  ResumePluginContext,
  ResumeSlotName,
} from "./types";
import { DECORATIVE_SLOTS } from "./types";

type SlotGroups = Partial<Record<ResumeSlotName, ResumePlugin<unknown>[]>>;

export interface SlotContextValue {
  orderedPlugins: ResumePlugin<unknown>[];
  context: ResumePluginContext<unknown>;
  slots: SlotGroups;
}

export const SlotContext = createContext<SlotContextValue | null>(null);

function sortByOrder(
  plugins: ResumePlugin<unknown>[]
): ResumePlugin<unknown>[] {
  return [...plugins].sort(
    (a, b) =>
      (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
      (b.priority ?? 0) - (a.priority ?? 0)
  );
}

/** 把插件按装饰累积槽预分组（过滤 + 排序一次完成） */
export function groupPluginsBySlot(
  plugins: ResumePlugin<unknown>[]
): SlotGroups {
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

/** 渲染一个已分组的装饰累积槽（不重复排序 / 过滤） */
function renderSlotGroup(
  plugins: ResumePlugin<unknown>[],
  context: ResumePluginContext<unknown>,
  hookName: ResumeSlotName
): React.ReactNode[] {
  return plugins.reduce<React.ReactNode[]>((acc, plugin) => {
    try {
      const node = (
        plugin.hooks as Record<
          string,
          (ctx: ResumePluginContext<unknown>) => React.ReactNode
        >
      )[hookName](context);
      if (node === null || node === undefined) return acc;
      acc.push(
        <PluginErrorBoundary key={`resume-slot-${plugin.name}`}>
          {node}
        </PluginErrorBoundary>
      );
      return acc;
    } catch (error) {
      console.warn(`[vane-resume] 插件 ${plugin.name} 的 ${hookName} 渲染失败`, error);
      return acc;
    }
  }, []);
}

/** 渲染某个装饰累积槽的所有插件输出 */
export function renderResumeSlot(
  plugins: ResumePlugin<unknown>[],
  context: ResumePluginContext<unknown>,
  hookName: ResumeSlotName
): React.ReactNode[] {
  return renderSlotGroup(
    groupPluginsBySlot(plugins)[hookName] ?? [],
    context,
    hookName
  );
}

/** fallback 支持惰性工厂：无插件覆盖时才会创建默认节点，避免白白渲染一片默认 DOM */
export type ContentFallback =
  | React.ReactNode
  | (() => React.ReactNode);

function resolveFallback(fallback: ContentFallback): React.ReactNode {
  return typeof fallback === "function" ? fallback() : fallback;
}

/**
 * 内容覆盖槽解析：在实现了该钩子的插件中，取 priority 最高且返回非 null 者胜出；
 * 若无任何插件返回非 null，才调用 fallback 生成核心默认结构。
 */
export function resolveResumeContentSlot(
  plugins: ResumePlugin<unknown>[],
  context: ResumePluginContext<unknown>,
  hookName: ResumeSlotName,
  fallback: ContentFallback
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
          (ctx: ResumePluginContext<unknown>) => React.ReactNode
        >
      )[hookName](context);
      if (node !== null && node !== undefined) {
        return (
          <PluginErrorBoundary key={`resume-content-${plugin.name}`}>
            {node}
          </PluginErrorBoundary>
        );
      }
    } catch (error) {
      console.warn(
        `[vane-resume] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
        error
      );
    }
  }
  return resolveFallback(fallback);
}

/** 读取装饰累积槽的所有片段（memo：宿主重渲染但 context 未变时不重复调用渲染） */
export function useResumeSlot(slot: ResumeSlotName): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  const plugins = ctx ? ctx.slots[slot] : null;
  const context = ctx ? ctx.context : null;
  return useMemo(
    () => (plugins && context ? renderSlotGroup(plugins, context, slot) : []),
    [plugins, context, slot]
  );
}

/**
 * 读取内容覆盖槽（单值；fallback 为核心默认结构）。
 * fallback 推荐传工厂：仅在没有插件覆盖时才创建默认节点；工厂本身不进入 memo 依赖，
 * 宿主每次重新渲染不会让插件内容渲染钩子反复执行。
 * 工厂结果再按工厂标识缓存：context 因无关 state 变化而重建时，默认树不会重复构造。
 */
export function useResumeContentSlot(
  slot: ResumeSlotName,
  fallback: ContentFallback
): React.ReactNode {
  const ctx = useContext(SlotContext);
  const orderedPlugins = ctx ? ctx.orderedPlugins : null;
  const context = ctx ? ctx.context : null;
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const fallbackCacheRef = useRef<{ fallback: ContentFallback; node: React.ReactNode } | null>(null);
  const getFallbackNode = () => {
    const current = fallbackRef.current;
    const cached = fallbackCacheRef.current;
    if (cached && cached.fallback === current) return cached.node;
    const node = resolveFallback(current);
    fallbackCacheRef.current = { fallback: current, node };
    return node;
  };
  const lazy = typeof fallback === "function";
  const stableFallback = lazy ? null : fallback;
  return useMemo(
    () =>
      orderedPlugins && context
        ? resolveResumeContentSlot(orderedPlugins, context, slot, getFallbackNode)
        : getFallbackNode(),
    // 惰性 fallback 只跟随 context / 插件集合变化；静态 fallback 仍参与比较
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedPlugins, context, slot, stableFallback]
  );
}

/**
 * 读取领域上下文（含 transformData 后的 data、state、setState、bus、forceUpdate…）。
 * 公共契约位：泛型默认值 any 保留，调用方不传 T 时沿用旧签名。
 */
export function useResumeContext<T = any>(): ResumePluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as ResumePluginContext<T>) ?? null;
}
