import type { CouponData } from "./types";

/**
 * 库存口径（纯函数，ProgressPlugin 与 ClaimStatePlugin 共用）。
 *
 * 「已抢完」必须是单一事实：stock ≤ 0 与 total > 0 && claimed ≥ total 取并集，
 * 任何一个成立都判 soldout。这样进度条写「已抢完」时领取按钮一定被门控，
 * 反过来按钮判 soldout 时进度条也一定写「已抢完」。
 */
export interface StockOverrides {
  /** 剩余库存（宿主侧权威值） */
  stock?: number;
  /** 发放总量覆盖（默认 coupon.total） */
  total?: number;
  /** 已领取数覆盖（默认 coupon.claimed） */
  claimed?: number;
}

export interface StockState {
  /** 生效总量（无法判定为 null） */
  total: number | null;
  /** 生效已领取数（无法判定为 null） */
  claimed: number | null;
  /** 剩余数量：stock 与 total - claimed 取更小的一方；都无法判定为 null */
  remaining: number | null;
  /** 已抢完（stock ≤ 0 或 claimed ≥ total，并集判定） */
  soldout: boolean;
  /** 已抢百分比 0-100（无法判定为 null） */
  percent: number | null;
}

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function resolveStock(
  coupon: Pick<CouponData, "total" | "claimed">,
  overrides: StockOverrides = {}
): StockState {
  const total = finiteNumber(overrides.total)
    ? overrides.total
    : finiteNumber(coupon.total)
      ? coupon.total
      : null;
  const claimed = finiteNumber(overrides.claimed)
    ? overrides.claimed
    : finiteNumber(coupon.claimed)
      ? coupon.claimed
      : null;
  const stock = finiteNumber(overrides.stock) ? overrides.stock : null;

  const totalSoldout =
    total !== null && total > 0 && claimed !== null && claimed >= total;
  const stockSoldout = stock !== null && stock <= 0;

  const percent =
    total !== null && total > 0 && claimed !== null
      ? Math.min(100, Math.round((Math.max(0, claimed) / total) * 100))
      : null;

  const candidates: number[] = [];
  if (stock !== null) candidates.push(Math.max(0, stock));
  if (total !== null) {
    candidates.push(Math.max(0, total - Math.max(0, claimed ?? 0)));
  }
  const remaining = candidates.length > 0 ? Math.min(...candidates) : null;

  return {
    total,
    claimed,
    remaining,
    soldout: totalSoldout || stockSoldout,
    percent,
  };
}
