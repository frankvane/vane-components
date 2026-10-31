/**
 * 领域槽位（仿 vane-profile 包内 renderProfileSlot）。
 *
 * 签到的「头部 / 日历 / 奖励 / 操作 / 底部」是结构化段落，内核 header / overlay /
 * footer 三槽无法表达段落语义，故提供包内领域槽。与内核 composeSlots 同一排序规则
 * （config.order 升序 → priority 降序），单个插件渲染抛错只丢自己那一段。
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type {
  SignInPlugin,
  SignInPluginContext,
  SignInSlotName,
} from "./types";

interface SlotContextValue {
  orderedPlugins: SignInPlugin<any>[];
  context: SignInPluginContext<any>;
}

const SlotContext = createContext<SlotContextValue | null>(null);

export function SignInSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: SignInPlugin<any>[];
  context: SignInPluginContext<any>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

export function renderSignInSlot(
  plugins: SignInPlugin<any>[],
  context: SignInPluginContext<any>,
  hookName: SignInSlotName
): React.ReactNode[] {
  return [...plugins]
    .filter(
      (p) =>
        p.enabled !== false &&
        typeof (p.hooks as Record<string, unknown>)[hookName] === "function"
    )
    .sort(
      (a, b) =>
        (a.config?.order ?? 0) - (b.config?.order ?? 0) ||
        (b.priority ?? 0) - (a.priority ?? 0)
    )
    .map((plugin, index) => {
      try {
        const node = (
          plugin.hooks as Record<
            string,
            (ctx: SignInPluginContext<any>) => React.ReactNode
          >
        )[hookName](context);
        if (node === null || node === undefined) return null;
        return (
          <PluginErrorBoundary key={`signin-slot-${plugin.name}-${index}`}>
            {node}
          </PluginErrorBoundary>
        );
      } catch (error) {
        console.warn(
          `[vane-sign-in] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
          error
        );
        return null;
      }
    })
    .filter(Boolean) as React.ReactNode[];
}

/** Core 读取某个领域槽位的所有片段 */
export function useSignInSlot(slot: SignInSlotName): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  if (!ctx) return [];
  return renderSignInSlot(ctx.orderedPlugins, ctx.context, slot);
}

/** 子组件读取领域上下文（含 data / callbacks） */
export function useSignInContext<T = any>(): SignInPluginContext<T> | null {
  const ctx = useContext(SlotContext);
  return (ctx?.context as SignInPluginContext<T>) ?? null;
}
