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

/**
 * 库存口径：选中变体库存 > data.inventory > 未知。
 *
 * 返回 `undefined` 表示「未知」，绝不能折算成 0 —— `ProductData.inventory` 与
 * `ProductVariant.stock` 都是可选的，契约写明「缺失表示未知」。旧版回落成 0，
 * 于是只传 price/title/image 的卡片首帧就被判成售罄并盖上整卡蒙层（P0-1）。
 */
function resolveInventory(
  context: { bus?: any; data?: any }
): number | undefined {
  const variant = context.bus?.getData?.(BusKeys.skuVariant) as
    | { stock?: number }
    | undefined;
  if (typeof variant?.stock === "number") return variant.stock;
  const inventory = (context.data as any)?.inventory;
  return typeof inventory === "number" ? inventory : undefined;
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
        // 未知库存（undefined）既不是售罄也不是紧张：什么都不渲染
        const known = typeof inventory === "number";
        const soldOut = showOverlayWhenSoldOut && known && inventory! <= 0;
        const lowStock = known && inventory! > 0 && inventory! <= lowStockThreshold;
        if (!soldOut && !lowStock) return null;
        return (
          <>
            {soldOut && (
              <div
                role="status"
                aria-live="polite"
                data-card-sold-out="true"
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
                  // 蒙层只是视觉提示，不能吞掉整卡的点击/滚动：
                  // 旧版没有这行，售罄时点规格、点加购、点主图全部无效。
                  pointerEvents: "none",
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
                  pointerEvents: "none",
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
