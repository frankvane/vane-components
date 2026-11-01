/**
 * 优惠券折扣的唯一计算口径（P1-5）。
 *
 * 旧版把 `discount` 一律当金额：`total = subtotal - discount`，于是「8 折券」
 * 写成 `discount: 8` 也只减 8 元；`discountType` 只在 CouponBar 里用来显示，
 * 从不参与计算。这里把它抽成唯一实现，四处（PriceCalculator / OrderSummary /
 * CouponRecommend / CouponBar）统一调用。
 *
 * 字段语义（写死在类型与文档里）：
 *  - `amount`：`discount` 是**金额**，最多减到小计为 0；
 *  - `percentage`：`discount` 是**折数**（8 = 8 折，付 80%）。兼容 `0 < discount <= 1`
 *    的比例写法（0.8 = 8 折）；大于 10 的值按 10 折（不打折）钳制。
 */

export type CouponDiscountType = "amount" | "percentage";

export interface CouponLike {
  code?: string;
  discount?: number;
  /** 缺省按 amount（历史行为） */
  discountType?: CouponDiscountType;
  /** 门槛：按「小计（含变体价 × 数量）」判断 */
  minAmount?: number;
}

/** 折扣金额（不超过小计） */
export function computeCouponCut(
  subtotal: number,
  coupon?: CouponLike | null
): number {
  if (!coupon) return 0;
  const sub = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const value = Number(coupon.discount ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;

  if (coupon.discountType === "percentage") {
    // 0 < value <= 1 视为比例（0.8 = 8 折），否则视为折数（8 = 8 折）
    const zhe = value <= 1 ? value * 10 : Math.min(10, value);
    return Math.min(sub, sub * (1 - zhe / 10));
  }
  return Math.min(sub, value);
}

/** 门槛判断（用含变体价的小计，而不是商品级 data.price） */
export function isCouponApplicable(
  subtotal: number,
  coupon?: CouponLike | null
): boolean {
  if (!coupon) return false;
  const min = Number(coupon.minAmount ?? 0);
  if (!Number.isFinite(min) || min <= 0) return true;
  const sub = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  return sub >= min;
}

/** 券面值的展示文案（金额 / 折数） */
export function couponValueLabel(
  coupon: CouponLike,
  currency = "¥"
): string {
  const value = Number(coupon.discount ?? 0);
  if (coupon.discountType === "percentage") {
    const zhe = value <= 1 ? value * 10 : value;
    return `${zhe}折`;
  }
  return `${currency}${value}`;
}

/** 「更优券」比较用：同一小计下折扣额更大者更优 */
export function compareCouponByCut(
  subtotal: number,
  a: CouponLike,
  b: CouponLike
): number {
  return computeCouponCut(subtotal, a) - computeCouponCut(subtotal, b);
}
