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
    // 未声明 slotPosition 的插件落 after 段（header 的 after / overlay / footer 都算 after 段）。
    // 这里曾经写成 `p.config?.slotPosition ?? position`，等价于「缺省时匹配任意 position」，
    // 于是同一个 header 插件会在 before 段和 after 段各渲染一次（图片/视频会重影）。
    // footer 槽同时接受显式 "footer" 与历史写法 "after" / 缺省，避免存量插件被滤掉。
    .filter((p) => {
      const declared = p.config?.slotPosition;
      if (position === "before") return declared === "before";
      if (position === "footer") {
        return declared === undefined || declared === "after" || declared === "footer";
      }
      return declared === undefined || declared === "after";
    })
    .sort(
      (a, b) =>
        (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
        (b.priority ?? 0) - (a.priority ?? 0)
    )
    .map((plugin) => {
      try {
        const node = (plugin.hooks as any)[hook](context);
        if (node === null || node === undefined) return null;
        // 每个插件单独一层错误边界：某个插件渲染期抛错只丢它自己，
        // 不会连带清空整条插槽（否则一个坏配置会让所有叠加层一起消失）。
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
      {renderPluginSlot(plugins, context, { hook: "renderFooter", position: "footer" })}
    </>
  );
}
