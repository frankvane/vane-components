import React, { useMemo } from "react";
import type { SignInPlugin, SignInPluginContext } from "./types";
import { SlotContext, groupPluginsBySlot } from "./slots";
import type { SlotContextValue } from "./slots";

/**
 * 由 withSignInPlugins 包在 WrappedComponent 外层，把当前实例的 orderedPlugins 与
 * 领域上下文下发给 SignInCore 与插件子组件（它们通过 useSignInSlot / useSignInContext 读取）。
 *
 * 单独成文件（而不是与 slots.tsx 同文件）：本文件只导出组件，slots.tsx 只导出
 * 运行时函数 / 钩子，二者各自满足 react-refresh 的 Fast Refresh 约束。
 *
 * props 统一以 `unknown` 承载泛型：槽位层只做分组、调用与上下文下发，不消费 data
 * 的具体形态（SignInPluginContext 的 T 本就不参与 data 形态）。
 */
export function SignInSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: SignInPlugin<unknown>[];
  context: SignInPluginContext<unknown>;
  children: React.ReactNode;
}) {
  const groups = useMemo(
    () => groupPluginsBySlot(orderedPlugins),
    [orderedPlugins]
  );
  const value = useMemo<SlotContextValue>(
    () => ({ groups, context }),
    [groups, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
