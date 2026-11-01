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

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import { BusKeys } from "./BusKeys";
import type { CardPlugin, CardPluginContext, PluginBus } from "./types";
import type { ProductAttributes } from "../types/product";

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
    .map((plugin) => {
      try {
        const node = (plugin.hooks as Record<string, (ctx: CardPluginContext<any>) => React.ReactNode>)[hookName](
          context
        );
        if (node === null || node === undefined) return null;
        // 每个插件单独一层错误边界：某个插件渲染期抛错只丢它自己。
        // key 只用插件名：带 index 会让片段在列表变化时错位重挂（P2-3）。
        return (
          <PluginErrorBoundary key={`card-slot-${plugin.name}`}>
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

/** 当前卡片实例的总线（复合组件与插件共享的唯一真源）；不在插件体系里时为 undefined */
export function useCardBus(): PluginBus | undefined {
  return useContext(SlotContext)?.context.bus;
}

/**
 * 订阅总线键并保持最新值。
 *
 * 订阅时先读一次当前值：插件 onMount 早于复合组件的 effect 时，写入已经发生，
 * 不补偿就会一直读到 undefined（表现为「插件改了规格，复合组件价格不动」）。
 */
export function useBusValue<T = unknown>(key: string): T | undefined {
  const bus = useCardBus();
  const [value, setValue] = useState<T | undefined>(() =>
    bus?.getData?.<T>(key)
  );
  useEffect(() => {
    if (!bus?.getData || !bus?.on) return;
    setValue(bus.getData<T>(key));
    return bus.on(key, () => setValue(bus.getData<T>(key)));
  }, [bus, key]);
  return value;
}

/**
 * 当前选中的规格属性：总线优先，其次调用方传入的本地 state（P1-4）。
 * 插件与复合组件都写总线后，这里的值就是唯一真源。
 */
export function useSelectedAttributes(
  fallback?: ProductAttributes
): ProductAttributes | undefined {
  const selection = useBusValue<Record<string, string>>(BusKeys.skuSelection);
  if (selection && Object.keys(selection).length > 0) return selection;
  return fallback;
}
