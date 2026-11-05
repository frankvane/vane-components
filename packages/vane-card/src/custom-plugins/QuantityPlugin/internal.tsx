import React from "react";

import type { PluginBus } from "../../components/CardPlugin/plugins/types";
import { BusKeys } from "../../components/CardPlugin/plugins/BusKeys";

export const Stepper: React.FC<{
  context: { bus?: PluginBus };
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
  // 卸载时清掉未触发的防抖定时器，避免组件已卸载还写总线（P2-8）
  React.useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );
  const setQ = React.useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, minActive), max);
      context.bus?.setData?.(BusKeys.quantity, clamped);
    },
    [context.bus, minActive, max]
  );
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
  }, [variantSku, min, max, resetOnVariantChange, setQ]);

  // 只在 max / clampOnMaxDecrease 变化时钳制；把 q 也放进依赖会让每次数量变化
  // 都重跑，并对总线里的历史写入做额外钳制，属于本次清理不允许改变的行为。
  React.useEffect(() => {
    if (max === 0) {
      if (q !== 0) setQ(0);
    } else if (clampOnMaxDecrease && q > max) {
      setQ(max);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, clampOnMaxDecrease, setQ]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#666" }}>数量</span>
      <button
        onClick={dec}
        disabled={q <= minActive}
        style={{
          minWidth: 32,
          lineHeight: 1,
          padding: "4px 10px",
          border: "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          // 按钮自己内联了白底，就必须自己给字色：只靠继承的话，宿主是深色
          // 页面时 -/+ 会变成浅字压在白底上（demo 里就这么丢过一次）。
          color: q <= minActive ? "#8f8f8f" : "#333",
          cursor: q <= minActive ? "not-allowed" : "pointer",
        }}
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
        style={{
          minWidth: 32,
          lineHeight: 1,
          padding: "4px 10px",
          border: "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          color: q >= max || max === 0 ? "#8f8f8f" : "#333",
          cursor: q >= max || max === 0 ? "not-allowed" : "pointer",
        }}
      >
        +
      </button>
      {max === 0 ? (
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#c62828", fontWeight: 700 }}>缺货</span>
      ) : (
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b6b6b" }}>最大 {max}</span>
      )}
      {(() => {
        const n = Number(inputVal);
        const invalid = !Number.isFinite(n) || n < minActive || n > max;
        return invalid ? (
          <span style={{ marginLeft: 8, fontSize: 12, color: "#c62828" }}>请输入 {minActive} 至 {max} 的整数</span>
        ) : null;
      })()}
    </div>
  );
};
