import React from "react";
import type { Plugin, PluginContext } from "../types";

export type SlotHookName = "renderOverlay" | "renderHeader" | "renderFooter";

export interface SlotOptions {
  hook: SlotHookName;
  /** before = 渲染在 children 之前；after = 之后。默认 after */
  position?: "before" | "after";
}

/**
 * 渲染某个插槽的所有插件输出。
 * 排序规则：config.order 升序（越小越靠前）→ priority 降序。
 * 渲染钩子是同步调用，单个插件抛错只丢它自己那一段，不影响其他插件。
 */
export function renderPluginSlot<TProps = any, TData = any>(
  plugins: Plugin<TProps, TData>[],
  context: PluginContext<TProps, TData>,
  options: SlotOptions
): React.ReactNode[] {
  const { hook, position = "after" } = options;

  return plugins
    .filter((p) => p.enabled !== false)
    .filter((p) => typeof p.hooks?.[hook] === "function")
    .filter((p) => (p.config?.slotPosition ?? position) === position)
    .sort(
      (a, b) =>
        (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
        (b.priority ?? 0) - (a.priority ?? 0)
    )
    .map((plugin, index) => {
      try {
        const node = (plugin.hooks as any)[hook](context);
        if (node === null || node === undefined) return null;
        return (
          <React.Fragment key={`vane-slot-${plugin.name}-${index}`}>{node}</React.Fragment>
        );
      } catch (error) {
        console.warn(`[vane/plugin-core] 插件 ${plugin.name} 的 ${hook} 渲染失败`, error);
        return null;
      }
    });
}

/**
 * 组装宿主组件的 children：
 * before-header → children → overlay → after-header → footer
 */
export function composeSlots<TProps = any, TData = any>(
  plugins: Plugin<TProps, TData>[],
  context: PluginContext<TProps, TData>,
  children: React.ReactNode
): React.ReactNode {
  return (
    <>
      {renderPluginSlot(plugins, context, { hook: "renderHeader", position: "before" })}
      {children}
      {renderPluginSlot(plugins, context, { hook: "renderOverlay" })}
      {renderPluginSlot(plugins, context, { hook: "renderHeader", position: "after" })}
      {renderPluginSlot(plugins, context, { hook: "renderFooter" })}
    </>
  );
}
