import React from "react";
import type { Plugin, PluginContext } from "../types";
import { PluginErrorBoundary } from "../sandbox/PluginErrorBoundary";

export type SlotHookName = "renderOverlay" | "renderHeader" | "renderFooter";

export interface SlotOptions {
  hook: SlotHookName;
  /**
   * before = 渲染在 children 之前；after = 之后；footer = 底部独立槽。
   * 默认 after。
   */
  position?: "before" | "after" | "footer";
}

type Position = NonNullable<SlotOptions["position"]>;
type SlotKey = "headerBefore" | "overlay" | "headerAfter" | "footer";

function matches<TProps, TData>(
  plugin: Plugin<TProps, TData>,
  hook: SlotHookName,
  position: Position
) {
  if (plugin.enabled === false) return false;
  if (typeof plugin.hooks?.[hook] !== "function") return false;
  const declared = plugin.config?.slotPosition;
  if (position === "before") return declared === "before";
  if (position === "footer") {
    return declared === undefined || declared === "after" || declared === "footer";
  }
  return declared === undefined || declared === "after";
}

function compare<TProps, TData>(a: Plugin<TProps, TData>, b: Plugin<TProps, TData>) {
  return (
    (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
    (b.priority ?? 0) - (a.priority ?? 0)
  );
}

function renderNodes<TProps, TData>(
  plugins: Plugin<TProps, TData>[],
  context: PluginContext<TProps, TData>,
  hook: SlotHookName
): React.ReactNode[] {
  const seen = new Set<string>();
  return plugins.map((plugin) => {
    // 同名插件只渲染一次：既避免重复 React key 警告，也避免同一逻辑输出两份
    if (seen.has(plugin.name)) return null;
    seen.add(plugin.name);
    try {
      const fn = plugin.hooks?.[hook] as
        | ((context: PluginContext<TProps, TData>) => React.ReactNode)
        | undefined;
      const node = fn?.(context);
      if (node === null || node === undefined) return null;
      // key 只用插件名：插件名在管理器内唯一，带上数组下标会让「调整插件顺序」
      // 变成整段重挂载，插件的内部态（展开 / 乐观态）会被无谓清空。
      return (
        <PluginErrorBoundary key={`vane-slot-${plugin.name}`}>
          {node}
        </PluginErrorBoundary>
      );
    } catch (error) {
      console.warn(`[vane/plugin-core] 插件 ${plugin.name} 的 ${hook} 渲染失败`, error);
      return null;
    }
  });
}

/**
 * 渲染某个插槽的所有插件输出。
 * 排序规则：config.order 升序（越小越靠前）→ priority 降序。
 */
export function renderPluginSlot<TProps = unknown, TData = unknown>(
  plugins: Plugin<TProps, TData>[],
  context: PluginContext<TProps, TData>,
  options: SlotOptions
): React.ReactNode[] {
  const { hook, position = "after" } = options;
  const selected = plugins
    .filter((plugin) => matches(plugin, hook, position))
    .sort(compare);
  return renderNodes(selected, context, hook);
}

/**
 * 组装宿主组件的 children：
 * before-header → children → overlay → after-header → footer
 */
export function composeSlots<TProps = unknown, TData = unknown>(
  plugins: Plugin<TProps, TData>[],
  context: PluginContext<TProps, TData>,
  children: React.ReactNode
): React.ReactNode {
  // 一次遍历分到 4 个槽，避免每个槽各自做 3 次 filter + sort
  const groups: Record<SlotKey, Plugin<TProps, TData>[]> = {
    headerBefore: [],
    overlay: [],
    headerAfter: [],
    footer: [],
  };
  for (const plugin of plugins) {
    if (matches(plugin, "renderHeader", "before")) groups.headerBefore.push(plugin);
    else if (matches(plugin, "renderHeader", "after")) groups.headerAfter.push(plugin);
    if (matches(plugin, "renderOverlay", "after")) groups.overlay.push(plugin);
    if (matches(plugin, "renderFooter", "footer")) groups.footer.push(plugin);
  }
  for (const key of Object.keys(groups) as SlotKey[]) groups[key].sort(compare);

  return (
    <>
      {renderNodes(groups.headerBefore, context, "renderHeader")}
      {children}
      {renderNodes(groups.overlay, context, "renderOverlay")}
      {renderNodes(groups.headerAfter, context, "renderHeader")}
      {renderNodes(groups.footer, context, "renderFooter")}
    </>
  );
}
