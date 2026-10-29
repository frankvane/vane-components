/**
 * InventoryPlugin - 库存状态（售罄覆盖层 / 低库存角标）
 *
 * 迁移要点（C3.3）：
 *  - 低库存角标以前挂在已删除的 renderBadge 钩子上，从来没显示过；现在并入
 *    renderOverlay（C2 已做）。
 *  - 库存口径与 QuantityPlugin 对齐：**选中变体的库存优先**，其次 data.inventory。
 *    旧版只看 data.inventory，于是「选了缺货规格 → 数量变 0，但卡片不显示售罄」。
 *    并订阅 skuVariant，切规格后状态实时跟着变。
 */

import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import { BusKeys } from "../../components/CardPlugin/plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../components/CardPlugin/plugins/utils/busHelpers";
import React from "react";

export interface InventoryPluginConfig {
  lowStockThreshold?: number; // 低库存阈值
  showOverlayWhenSoldOut?: boolean; // 售罄时覆盖层
}

/** 库存口径：选中变体库存 > data.inventory > 0（与 QuantityPlugin.getMax 保持一致） */
function resolveInventory(context: { bus?: any; data?: any }): number {
  const variant = context.bus?.getData?.(BusKeys.skuVariant) as
    | { stock?: number }
    | undefined;
  if (typeof variant?.stock === "number") return variant.stock;
  const inventory = (context.data as any)?.inventory;
  return typeof inventory === "number" ? inventory : 0;
}

export const createInventoryPlugin: PluginCreator<any, InventoryPluginConfig> = (
  config = {}
) => {
  const { lowStockThreshold = 5, showOverlayWhenSoldOut = true } = config;

  const plugin: CardPlugin = {
    name: "InventoryPlugin",
    version: "1.1.0",
    description: "库存状态展示插件（售罄覆盖层 / 低库存角标）",
    priority: 45,
    hooks: {
      // 切规格后库存口径变了，需要重渲染
      onMount: (context) =>
        setupForceUpdateOnBusKeys(context, [BusKeys.skuVariant]),

      renderOverlay: (context) => {
        const inventory = resolveInventory(context);
        const soldOut = showOverlayWhenSoldOut && inventory <= 0;
        const lowStock = inventory > 0 && inventory <= lowStockThreshold;
        if (!soldOut && !lowStock) return null;
        return (
          <>
            {soldOut && (
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
            )}
            {lowStock && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: "#b35c00",
                  color: "#fff",
                  padding: "4px 8px",
                  fontSize: 12,
                  borderRadius: 4,
                  zIndex: 10,
                }}
              >
                库存紧张
              </div>
            )}
          </>
        );
      },
    },
    config,
  };

  return plugin;
};
