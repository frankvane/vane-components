import React, { createContext, useContext } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type { ModalSheetPlugin, ModalSheetPluginContext } from "./types";

export type ModalSheetSlotHook =
  | "renderBackdrop"
  | "renderHandle"
  | "renderHeader"
  | "renderFooter"
  | "renderOverlay";

export interface SlotContextValue {
  orderedPlugins: ModalSheetPlugin[];
  context: ModalSheetPluginContext;
}

export const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 渲染某个槽位的插件产物。
 * 排序：config.order 升序 → priority 降序；单插件抛错只丢它自己。
 * 槽位钩子必须是纯渲染函数（只返回 JSX），不得调用 React hooks。
 */
function renderSlot(
  plugins: ModalSheetPlugin<unknown>[],
  context: ModalSheetPluginContext,
  hook: ModalSheetSlotHook
): React.ReactNode[] {
  return [...plugins]
    .filter(
      (p) =>
        p.enabled !== false &&
        typeof (p.hooks as Record<string, unknown>)[hook] === "function"
    )
    .sort(
      (a, b) =>
        (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
        (b.priority ?? 0) - (a.priority ?? 0)
    )
    .map((plugin) => {
      try {
        const node = (
          plugin.hooks as Record<
            string,
            (ctx: ModalSheetPluginContext) => React.ReactNode
          >
        )[hook](context);
        if (node === null || node === undefined) return null;
        return (
          <PluginErrorBoundary key={`vane-ms-slot-${plugin.name}`}>
            {node}
          </PluginErrorBoundary>
        );
      } catch (error) {
        console.warn(
          `[vane-modal-sheet] 插件 ${plugin.name} 的 ${hook} 渲染失败`,
          error
        );
        return null;
      }
    })
    .filter(Boolean) as React.ReactNode[];
}

/** Core 读取某个 DOM 槽位的所有片段 */
export function useModalSheetSlot(slot: ModalSheetSlotHook): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  if (!ctx) return [];
  return renderSlot(ctx.orderedPlugins, ctx.context, slot);
}

/** 子组件读取领域上下文（含 progress / currentSnap 等时基 getter） */
export function useModalSheetContext(): ModalSheetPluginContext | null {
  const ctx = useContext(SlotContext);
  return ctx?.context ?? null;
}
