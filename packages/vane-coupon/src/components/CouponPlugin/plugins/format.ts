import type { CouponData } from "./types";

/**
 * 面额 / 门槛格式化（纯函数，Core 与插件共用）。
 *
 * 口径：
 *   cash     —— 固定两位小数（10.5 → 「10.50」），避免「¥10.5」这类不规范展示；
 *   discount —— 去掉多余的 0（8.50 → 「8.5」，10.00 → 「10」= 10 折 / 100%）；
 *   非有限值 —— 统一兜底为「—」，不再把 NaN 直接渲染给用户。
 */
export const AMOUNT_FALLBACK = "—";

const trimTrailingZeros = (text: string): string =>
  text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;

/** 面额格式化；amountType 缺省按 cash */
export function formatAmount(
  amount: unknown,
  amountType: CouponData["amountType"] = "cash"
): string {
  const value =
    typeof amount === "number" && Number.isFinite(amount) ? amount : null;
  if (value === null) return AMOUNT_FALLBACK;
  const fixed = value.toFixed(2);
  return amountType === "discount" ? trimTrailingZeros(fixed) : fixed;
}

export interface ThresholdResolution {
  /** none = 无门槛；valid = 有门槛；invalid = 数据非法（NaN / 负数 / 非数字） */
  state: "none" | "valid" | "invalid";
  value: number | null;
  text: string;
}

/**
 * 门槛解析：undefined / null / 0 视为无门槛；负数与非有限值单独归类为「数据非法」，
 * 不再静默降级成「无门槛」（否则会把一张满 199 的券展示成随便用）。
 */
export function resolveThreshold(threshold: unknown): ThresholdResolution {
  if (threshold === undefined || threshold === null) {
    return { state: "none", value: null, text: "无门槛" };
  }
  if (typeof threshold !== "number" || !Number.isFinite(threshold)) {
    return { state: "invalid", value: null, text: "门槛待确认" };
  }
  if (threshold === 0) {
    return { state: "none", value: null, text: "无门槛" };
  }
  if (threshold < 0) {
    return { state: "invalid", value: null, text: "门槛待确认" };
  }
  return {
    state: "valid",
    value: threshold,
    text: `满${trimTrailingZeros(threshold.toFixed(2))}可用`,
  };
}
