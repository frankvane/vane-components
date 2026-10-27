import type { CardPlugin, PluginCreator } from "../../plugins/types";
import React from "react";

export interface InventoryPluginConfig {
  lowStockThreshold?: number; // 低库存阈值
  showOverlayWhenSoldOut?: boolean; // 售罄时覆盖层
}

export const createInventoryPlugin: PluginCreator<any, InventoryPluginConfig> = (
  config = {}
) => {
  const { lowStockThreshold = 5, showOverlayWhenSoldOut = true } = config;

  const plugin: CardPlugin = {
    name: "InventoryPlugin",
    version: "1.0.0",
    description: "库存状态展示插件（徽章/覆盖层）",
    priority: 45,
    hooks: {
      renderOverlay: (context) => {
        const inventory: number = (context.data as any)?.inventory ?? 0;
        if (showOverlayWhenSoldOut && inventory <= 0) {
          return (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 8,
                zIndex: 9,
              }}
            >
              已售罄
            </div>
          );
        }
        return null;
      },
      renderBadge: (context) => {
        const inventory: number = (context.data as any)?.inventory ?? 0;
        if (inventory > 0 && inventory <= lowStockThreshold) {
          return (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "#FF9800",
                color: "#fff",
                padding: "4px 8px",
                fontSize: 12,
                borderRadius: 4,
                zIndex: 10,
              }}
            >
              库存紧张
            </div>
          );
        }
        return null;
      },
    },
    config,
  };

  return plugin;
};