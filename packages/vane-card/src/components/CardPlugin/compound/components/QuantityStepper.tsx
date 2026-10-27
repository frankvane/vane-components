import React from "react";
import { useProductCard } from "../ProductCard";
import { matchVariant, variantListOf } from "../../types/product";

export type QuantityStepperProps = {
  min?: number;
  max?: number;
  step?: number;
  /** 可用库存（若不传则从选中变体或 data.inventory 推断） */
  available?: number;
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

  // 与 InventoryPlugin 同一口径：选中变体库存 > data.inventory > 未知
  const selectedStock = matchVariant(variantListOf(data), state.attributes)?.stock;
  const inferredAvailable =
    typeof available === "number"
      ? available
      : typeof selectedStock === "number"
        ? selectedStock
        : typeof data?.inventory === "number"
          ? data.inventory
          : undefined;

  const effectiveMax = typeof inferredAvailable === "number" ? Math.min(max, Math.max(0, inferredAvailable)) : max;
  const qty = typeof state.quantity === "number" ? state.quantity : Math.max(min, 1);

  const update = (next: number) => {
    const clamped = Math.max(min, Math.min(effectiveMax, next));
    setState((s) => ({ ...s, quantity: clamped }));
    onChange?.(clamped);
  };

  return (
    <div className={`vc-stepper ${className ?? ""}`.trim()} style={style}>
      <button
        type="button"
        className="vc-stepper__btn"
        onClick={() => update(qty - step)}
        disabled={qty <= min || effectiveMax <= 0}
        aria-label="减少数量"
      >
        −
      </button>
      <input
        className="vc-stepper__input"
        type="number"
        value={qty}
        min={min}
        max={effectiveMax}
        step={step}
        onChange={(e) => update(Number(e.target.value))}
        aria-label="购买数量"
      />
      <button
        type="button"
        className="vc-stepper__btn"
        onClick={() => update(qty + step)}
        disabled={qty >= effectiveMax || effectiveMax <= 0}
        aria-label="增加数量"
      >
        +
      </button>
      {effectiveMax <= 0 && <span className="vc-stepper__hint">库存不足</span>}
    </div>
  );
};
