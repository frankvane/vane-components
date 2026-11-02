import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type { ModalSheetPlugin, ModalSheetPluginContext } from "./types";

export type ModalSheetSlotHook =
  | "renderBackdrop"
  | "renderHandle"
  | "renderHeader"
  | "renderFooter"
  | "renderOverlay";

interface SlotContextValue {
  orderedPlugins: ModalSheetPlugin[];
  context: ModalSheetPluginContext;
}

const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 弹层 DOM 插槽提供者：把运行时排好序的插件 + 领域上下文下发给 Core，
 * 供 useModalSheetSlot 渲染 backdrop / handle / header / footer / overlay。
 * 面板的 transform / 高度由内核引擎独占，槽位只承载各插件自己的视觉件。
 */
export function ModalSheetSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: ModalSheetPlugin[];
  context: ModalSheetPluginContext;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return (
    <SlotContext.Provider value={value}>{children}</SlotContext.Provider>
  );
}

/**
 * 渲染某个槽位的插件产物。
 * 排序：config.order 升序 → priority 降序；单插件抛错只丢它自己。
 * 槽位钩子必须是纯渲染函数（只返回 JSX），不得调用 React hooks。
 */
function renderSlot(
  plugins: ModalSheetPlugin<any>[],
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
