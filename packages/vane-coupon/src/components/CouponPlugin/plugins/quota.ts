import type { CouponData } from "./types";

/**
 * 每人限领口径（纯函数，QuotaPlugin 与 ClaimStatePlugin 共用）。
 * 未声明 quota 视为不限领；quota = 0 时任何已领数（含 0）都算超限。
 */
export interface QuotaOverrides {
  /** 限领张数覆盖（默认 coupon.quota） */
  quota?: number;
  /** 当前用户已领张数，默认 0 */
  purchasedCount?: number;
}

export interface QuotaState {
  quota: number | null;
  purchased: number;
  reached: boolean;
}

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function resolveQuota(
  coupon: Pick<CouponData, "quota">,
  overrides: QuotaOverrides = {}
): QuotaState {
  const quota = finiteNumber(overrides.quota)
    ? overrides.quota
    : finiteNumber(coupon.quota)
      ? coupon.quota
      : null;
  const purchased =
    finiteNumber(overrides.purchasedCount) && overrides.purchasedCount >= 0
      ? overrides.purchasedCount
      : 0;
  return {
    quota,
    purchased,
    reached: quota !== null && purchased >= quota,
  };
}
