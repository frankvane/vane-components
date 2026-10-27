import React from "react";
import { useProductCard } from "../ProductCard";

export type QuantityStepperProps = {
  min?: number;
  max?: number;
  step?: number;
  available?: number; // 可用库存（若不传则从 data/variants 推断）
  className?: string;
  style?: React.CSSProperties;
  onChange?: (qty: number) => void;
};

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  min = 1,
  max = 99,
  step = 1,
  available,
  className,
  style,
  onChange,
}) => {
  const { state, setState, data } = useProductCard();

  // 根据已选属性推断当前变体库存；若无变体则使用总体库存
  const getSelectedVariantStock = (): number | undefined => {
    const attrs = state.attributes || {};
    const variants: any[] | undefined = (data?.variants && Array.isArray(data.variants)) ? data.variants : undefined;
    if (!variants || !Object.keys(attrs).length) return undefined;
    const match = variants.find((v) => {
      const opts = (v.options || v.attributes) || {};
      return Object.keys(attrs).every((k) => String(opts[k]) === String((attrs as any)[k]));
    });
    return typeof match?.stock === "number" ? match.stock : undefined;
  };

  const inferredAvailable =
    typeof available === "number"
      ? available
      : getSelectedVariantStock() ?? (typeof data?.inventory === "number" ? data.inventory : undefined);

  const effectiveMax = typeof inferredAvailable === "number" ? Math.min(max, Math.max(0, inferredAvailable)) : max;
  const qty = typeof state.quantity === "number" ? state.quantity : Math.max(min, 1);

  const update = (next: number) => {
    const clamped = Math.max(min, Math.min(effectiveMax, next));
    setState((s) => ({ ...s, quantity: clamped }));
    onChange?.(clamped);
  };

  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8, ...style }}>
      <button
        onClick={() => update(qty - step)}
        disabled={qty <= min || effectiveMax <= 0}
        style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}
        aria-label="减少数量"
      >
        −
      </button>
      <input
        type="number"
        value={qty}
        min={min}
        max={effectiveMax}
        step={step}
        onChange={(e) => update(Number(e.target.value))}
        style={{ width: 56, textAlign: "center", padding: "4px 6px", border: "1px solid #ddd", borderRadius: 6 }}
        aria-label="购买数量"
      />
      <button
        onClick={() => update(qty + step)}
        disabled={qty >= effectiveMax || effectiveMax <= 0}
        style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}
        aria-label="增加数量"
      >
        +
      </button>
      {effectiveMax <= 0 && (
        <span style={{ marginLeft: 8, color: "#999", fontSize: 13 }}>库存不足</span>
      )}
    </div>
  );
};