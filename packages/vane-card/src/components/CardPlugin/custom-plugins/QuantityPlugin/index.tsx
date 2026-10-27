/**
 * QuantityPlugin - 数量步进器插件
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../plugins/utils/busHelpers";
import { applyDefaults } from "../../plugins/utils/config";
import React from "react";

export interface QuantityPluginConfig {
  min?: number;
  max?: number; // 若未设置，则自动根据变体库存或整体库存推断
  step?: number;
  renderIn?: "footer" | "overlay";
  useVariantStock?: boolean; // 优先使用选中变体的库存作为上限
  resetOnVariantChange?: boolean; // 规格切换时是否重置数量到最小值
  clampOnMaxDecrease?: boolean; // 当最大值下降时是否钳制到新上限
}

function getMax(context: any, config: QuantityPluginConfig, min: number): number {
  if (typeof config.max === "number") return Math.max(min, config.max);
  const variant = context.bus?.getData?.(BusKeys.skuVariant) as { stock?: number } | undefined;
  const stockVariant = config.useVariantStock !== false ? variant?.stock : undefined;
  const inventory = (context.data as any)?.inventory as number | undefined;
  const cap = typeof stockVariant === "number" ? stockVariant : typeof inventory === "number" ? inventory : undefined;
  if (typeof cap === "number") {
    // 库存为 0 时直接返回 0（缺货），避免最小值提升为 1
    if (cap <= 0) return 0;
    return Math.max(min, cap);
  }
  return 99;
}

const Stepper: React.FC<{
  context: any;
  min: number;
  step: number;
  max: number;
  resetOnVariantChange?: boolean;
  clampOnMaxDecrease?: boolean;
}> = ({ context, min, step, max, resetOnVariantChange = true, clampOnMaxDecrease = true }) => {
  const minActive = max === 0 ? 0 : min;
  const q = (context.bus?.getData?.(BusKeys.quantity) as number | undefined) ?? minActive;
  // 输入防抖与本地显示值（不立即写入总线）
  const [inputVal, setInputVal] = React.useState<string>(String(q));
  React.useEffect(() => {
    setInputVal(String(q));
  }, [q]);
  const timerRef = React.useRef<number | undefined>(undefined);
  const setQ = (next: number) => {
    const clamped = Math.min(Math.max(next, minActive), max);
    context.bus?.setData?.(BusKeys.quantity, clamped);
  };
  const dec = () => setQ(q - step);
  const inc = () => setQ(q + step);

  // 当规格切换时重置数量到默认值；当库存上限缩小时自动钳制
  const variantSku = (context.bus?.getData?.(BusKeys.skuVariant) as { sku?: string } | undefined)?.sku;
  const prevSkuRef = React.useRef<string | undefined>(variantSku);
  React.useEffect(() => {
    if (prevSkuRef.current !== variantSku) {
      prevSkuRef.current = variantSku;
      if (resetOnVariantChange) {
        setQ(max === 0 ? 0 : min);
      }
    }
  }, [variantSku, min, max, resetOnVariantChange]);

  React.useEffect(() => {
    if (max === 0) {
      if (q !== 0) setQ(0);
    } else if (clampOnMaxDecrease && q > max) {
      setQ(max);
    }
  }, [max, clampOnMaxDecrease]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#666" }}>数量</span>
      <button
        onClick={dec}
        disabled={q <= minActive}
        style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", cursor: q <= min ? "not-allowed" : "pointer" }}
      >
        -
      </button>
      <input
        type="number"
        value={inputVal}
        min={minActive}
        max={max}
        step={step}
        onChange={(e) => {
          const val = e.target.value;
          setInputVal(val);
          if (timerRef.current) {
            window.clearTimeout(timerRef.current);
          }
          timerRef.current = window.setTimeout(() => {
            const n = Number(val);
            if (Number.isFinite(n)) {
              setQ(n);
            }
          }, 150);
        }}
        disabled={max === 0}
        style={{ width: 56, textAlign: "center", padding: "4px 8px", border: "1px solid #ddd", borderRadius: 6, background: max === 0 ? "#f7f7f7" : "#fff", color: max === 0 ? "#bbb" : "#333" }}
      />
      <button
        onClick={inc}
        disabled={q >= max || max === 0}
        style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", cursor: q >= max ? "not-allowed" : "pointer" }}
      >
        +
      </button>
      {max === 0 ? (
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#e53935", fontWeight: 700 }}>缺货</span>
      ) : (
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#999" }}>最大 {max}</span>
      )}
      {(() => {
        const n = Number(inputVal);
        const invalid = !Number.isFinite(n) || n < minActive || n > max;
        return invalid ? (
          <span style={{ marginLeft: 8, fontSize: 12, color: "#e53935" }}>请输入 {minActive} 至 {max} 的整数</span>
        ) : null;
      })()}
    </div>
  );
};

export const createQuantityPlugin: PluginCreator<any, QuantityPluginConfig> = (
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