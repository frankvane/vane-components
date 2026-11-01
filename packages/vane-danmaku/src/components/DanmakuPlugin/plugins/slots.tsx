import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  DanmakuPlugin,
  DanmakuPluginContext,
  DanmakuPluginHooks,
} from "./types";

type SlotHook = "renderOverlay" | "renderHeader" | "renderFooter";

interface SlotContextValue {
  orderedPlugins: DanmakuPlugin<any>[];
  context: DanmakuPluginContext<any>;
}

const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 弹幕 DOM 插槽提供者：把运行时排好序的插件 + 领域上下文下发给 Core，
 * 供 useDanmakuSlot 渲染 overlay / header / footer（控制面板 / 过滤开关 / 指令输入框等）。
 * 弹幕主体（飞行文字）由 canvas 内核绘制，这些 DOM 槽只承载交互控件。
 */
export function DanmakuSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: DanmakuPlugin<any>[];
  context: DanmakuPluginContext<any>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

function renderDanmakuSlot(
  plugins: DanmakuPlugin<any>[],
  context: DanmakuPluginContext<any>,
  hook: SlotHook
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
    .map((plugin, index) => {
      try {
        const node = (
          plugin.hooks as Record<string, (ctx: DanmakuPluginContext<any>) => React.ReactNode>
        )[hook](context);
        if (node === null || node === undefined) return null;
        return (
          <PluginErrorBoundary key={`danmaku-slot-${plugin.name}-${index}`}>
            {node}
          </PluginErrorBoundary>
        );
      } catch (error) {
        console.warn(`[vane-danmaku] 插件 ${plugin.name} 的 ${hook} 渲染失败`, error);
        return null;
      }
    })
    .filter(Boolean) as React.ReactNode[];
}

/** Core 读取某个 DOM 槽位的所有片段 */
export function useDanmakuSlot(slot: SlotHook): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  if (!ctx) return [];
  return renderDanmakuSlot(ctx.orderedPlugins, ctx.context, slot);
}

/** 子组件读取领域上下文（含 data / bus / state） */
export function useDanmakuContext<T = any>(): DanmakuPluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as DanmakuPluginContext<T>) ?? null;
}

export type { DanmakuPluginHooks };
