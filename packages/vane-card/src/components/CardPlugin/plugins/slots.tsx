/**
 * 领域槽位（D3-A · 包内 renderDomainSlot）
 *
 * 价格区（priceArea）是「插件 ↔ 复合组件」的接缝：PriceCalculator / ComparePrice /
 * CouponRecommend 等插件通过 renderPriceArea 产出片段，复合组件（Price / CouponBar /
 * OrderSummaryPanel）通过 usePluginSlot("priceArea") 把它们渲染进自己的布局。
 *
 * 与内核 composeSlots 保持同一套排序规则（config.order 升序 → priority 降序），
 * 单个插件渲染抛错只丢自己那一段（PluginErrorBoundary 隔离）。
 */

import React, { createContext, useContext, useMemo } from "react";
import { PluginErrorBoundary } from "@vane/plugin-core";
import type { CardPlugin, CardPluginContext } from "./types";

export type PluginSlotName = "priceArea";

interface SlotContextValue {
  orderedPlugins: CardPlugin<any>[];
  context: CardPluginContext<any>;
}

const SlotContext = createContext<SlotContextValue | null>(null);

/**
 * 由 withPlugins 包在 WrappedComponent 外层，把当前实例的 orderedPlugins 与
 * 领域上下文下发给所有复合组件（它们通过 usePluginSlot 读价格区片段）。
 */
export function CardSlotProvider({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: CardPlugin<any>[];
  context: CardPluginContext<any>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({ orderedPlugins, context }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

/**
 * 渲染某个领域槽位的所有插件输出。
 * 排序：config.order 升序（越小越靠前）→ priority 降序（越大越靠后）。
 */
export function renderDomainSlot(
  plugins: CardPlugin<any>[],
  context: CardPluginContext<any>,
  hookName: "renderPriceArea"
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
        const node = (plugin.hooks as Record<string, (ctx: CardPluginContext<any>) => React.ReactNode>)[hookName](
          context
        );
        if (node === null || node === undefined) return null;
        // 每个插件单独一层错误边界：某个插件渲染期抛错只丢它自己
        return (
          <PluginErrorBoundary key={`card-slot-${plugin.name}-${index}`}>
            {node}
          </PluginErrorBoundary>
        );
      } catch (error) {
        console.warn(
          `[vane-card] 插件 ${plugin.name} 的 ${hookName} 渲染失败`,
          error
        );
        return null;
      }
    })
    .filter(Boolean) as React.ReactNode[];
}

/**
 * 复合组件读取价格区片段（签名与旧 SlotsContext.usePluginSlot 完全一致，零改动）。
 */
export function usePluginSlot(slot: PluginSlotName): React.ReactNode[] {
  const ctx = useContext(SlotContext);
  if (!ctx) return [];
  return renderDomainSlot(ctx.orderedPlugins, ctx.context, "renderPriceArea");
}
