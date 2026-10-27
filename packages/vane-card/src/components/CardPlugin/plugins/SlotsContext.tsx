import React, { createContext, useContext, useMemo } from "react";
import type { CardPlugin, CardPluginContext } from "./types";

export type PluginSlotName = "priceArea";

type PluginSlotsContextValue = {
  getSlotNodes: (slot: PluginSlotName) => React.ReactNode[];
};

const PluginSlotsContext = createContext<PluginSlotsContextValue | null>(null);

export function PluginSlotsProvider({
  pluginContext,
  plugins,
  children,
}: {
  pluginContext: CardPluginContext<any>;
  plugins: CardPlugin<any>[];
  children: React.ReactNode;
}) {
  const value = useMemo<PluginSlotsContextValue>(() => {
    const getSlotNodes = (slot: PluginSlotName) => {
      switch (slot) {
        case "priceArea": {
          // 排序规则：优先使用插件配置中的 order；否则按注册顺序
          const sorted = [...plugins].sort(
            (a, b) => (a.config?.order ?? 0) - (b.config?.order ?? 0)
          );
          const nodes: React.ReactNode[] = [];
          sorted.forEach((p) => {
            const node = p.hooks.renderPriceArea?.(pluginContext);
            if (node) nodes.push(node);
          });
          return nodes;
        }
        default:
          return [];
      }
    };

    return { getSlotNodes };
  }, [plugins, pluginContext]);

  return (
    <PluginSlotsContext.Provider value={value}>
      {children}
    </PluginSlotsContext.Provider>
  );
}

export function usePluginSlot(slot: PluginSlotName): React.ReactNode[] {
  const ctx = useContext(PluginSlotsContext);
  return ctx?.getSlotNodes(slot) ?? [];
}