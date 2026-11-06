/**
 * QuantityPlugin - 数量步进器插件
 */
import type { CardPlugin, PluginBus, PluginCreator } from "../../components/CardPlugin/plugins/types";
import { BusKeys } from "../../components/CardPlugin/plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../components/CardPlugin/plugins/utils/busHelpers";
import { applyDefaults } from "../../components/CardPlugin/plugins/utils/config";
import React from "react";

import { Stepper } from "./internal";

export interface QuantityPluginConfig {
  min?: number;
  max?: number; // 若未设置，则自动根据变体库存或整体库存推断
  step?: number;
  renderIn?: "footer" | "overlay";
  useVariantStock?: boolean; // 优先使用选中变体的库存作为上限
  resetOnVariantChange?: boolean; // 规格切换时是否重置数量到最小值
  clampOnMaxDecrease?: boolean; // 当最大值下降时是否钳制到新上限
}

function getMax(
  context: { bus?: PluginBus; data?: unknown },
  config: QuantityPluginConfig,
  min: number
): number {
  if (typeof config.max === "number") return Math.max(min, config.max);
  const variant = context.bus?.getData?.(BusKeys.skuVariant) as { stock?: number } | undefined;
  const stockVariant = config.useVariantStock !== false ? variant?.stock : undefined;
  const inventory = (context.data as { inventory?: number } | undefined)?.inventory;
  const cap = typeof stockVariant === "number" ? stockVariant : typeof inventory === "number" ? inventory : undefined;
  if (typeof cap === "number") {
    // 库存为 0 时直接返回 0（缺货），避免最小值提升为 1
    if (cap <= 0) return 0;
    return Math.max(min, cap);
  }
  return 99;
}

// 工厂返回 T 收敛为 unknown：T 仅经 data 透传，自定义 data 形态的调用方请显式写泛型参数。
export const createQuantityPlugin: PluginCreator<unknown, QuantityPluginConfig> = (
  config = {}
) => {
  const cfg = applyDefaults<QuantityPluginConfig>(config, {
    min: 1,
    step: 1,
    renderIn: "footer",
    useVariantStock: true,
    resetOnVariantChange: true,
    clampOnMaxDecrease: true,
  });

  const plugin: CardPlugin = {
    name: "QuantityPlugin",
    version: "1.0.0",
    description: "数量选择步进器（联动库存/变体）",
    priority: 30,
    hooks: {
      onMount: (context) => {
        const currentMax = getMax(context, { ...cfg }, cfg.min ?? 1);
        const initial = currentMax === 0 ? 0 : Math.max(cfg.min ?? 1, 1);
        context.bus?.setData?.(BusKeys.quantity, initial);
        // 针对数量与变体变化订阅强制刷新
        const cleanup = setupForceUpdateOnBusKeys(context, [
          BusKeys.quantity,
          BusKeys.skuVariant,
        ]);
        // 在卸载时清理（挂载内返回清理函数）
        return cleanup;
      },
      renderFooter: (context) => {
        if (cfg.renderIn !== "footer") return null;
        const max = getMax(context, { ...cfg }, cfg.min ?? 1);
        return (
          <div style={{ padding: 12, borderTop: "1px dashed #eee" }}>
            <Stepper
              context={context}
              min={cfg.min ?? 1}
              step={cfg.step ?? 1}
              max={max}
              resetOnVariantChange={cfg.resetOnVariantChange}
              clampOnMaxDecrease={cfg.clampOnMaxDecrease}
            />
          </div>
        );
      },
      renderOverlay: (context) => {
        if (cfg.renderIn !== "overlay") return null;
        const max = getMax(context, { ...cfg }, cfg.min ?? 1);
        return (
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 8, zIndex: 9 }}>
            <Stepper
              context={context}
              min={cfg.min ?? 1}
              step={cfg.step ?? 1}
              max={max}
              resetOnVariantChange={cfg.resetOnVariantChange}
              clampOnMaxDecrease={cfg.clampOnMaxDecrease}
            />
          </div>
        );
      },
    },
    config: cfg,
  };

  return plugin;
};
