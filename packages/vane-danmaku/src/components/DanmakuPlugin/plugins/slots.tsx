import React, { createContext, useContext } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  DanmakuPlugin,
  DanmakuPluginContext,
  DanmakuPluginHooks,
} from "./types";

type SlotHook = "renderOverlay" | "renderHeader" | "renderFooter";

export interface SlotContextValue {
  orderedPlugins: DanmakuPlugin<unknown>[];
  context: DanmakuPluginContext<unknown>;
}

export const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 渲染某个槽位的插件产物。
 * 注意：槽位钩子必须是纯渲染函数（只返回 JSX），不得调用 React hooks ——
 * 它们是在 Slot 组件渲染体内被直接调用的；需要状态请在返回的子组件内部管理。
 */
function renderDanmakuSlot(
  plugins: DanmakuPlugin<unknown>[],
  context: DanmakuPluginContext<unknown>,
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
    .map((plugin) => {
      try {
        const node = (
          plugin.hooks as Record<
            string,
            (ctx: DanmakuPluginContext<unknown>) => React.ReactNode
          >
        )[hook](context);
        if (node === null || node === undefined) return null;
        return (
          <PluginErrorBoundary key={`danmaku-slot-${plugin.name}`}>
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

/**
 * 子组件读取领域上下文（含 data / bus / state）。
 * 公共契约位：泛型默认值 any 保留，调用方不传 T 时沿用旧签名。
 */
export function useDanmakuContext<T = any>(): DanmakuPluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as DanmakuPluginContext<T>) ?? null;
}

export type { DanmakuPluginHooks };
