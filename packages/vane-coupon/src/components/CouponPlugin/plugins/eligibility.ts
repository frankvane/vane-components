import type {
  CouponData,
  CouponEligibility,
  CouponEligibilityReason,
  CouponOrderContext,
} from "./types";
import { computeValidity } from "./validity";
import { resolveQuota } from "./quota";
import { resolveStock } from "./stock";

/**
 * 券可用性判定（纯函数，无 React 依赖）。
 *
 * 判定项：门槛 / 有效期 / 商品范围 / 互斥组 / 叠加规则 / 限领 / 库存。
 * 金额一律换算成「分」比较，避免 0.1 + 0.2 这类浮点误差把「刚好满 199」
 * 判成不满足；门槛刚好等于订单金额时视为满足。
 *
 * 契约：未传 order（或 order 里没有可判定的金额/商品）时，相关项保持可判定性，
 * 门槛无法核对会直接判为不满足（reasons 含 threshold，gap 为 null），
 * 这是「宁可少领一张，不可错领一张」的保守口径。
 */

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toCents = (value: number): number => Math.round(value * 100);

const sumItems = (items: CouponOrderContext["items"]): number | null => {
  if (!items || items.length === 0) return null;
  let total = 0;
  for (const item of items) {
    if (!finiteNumber(item?.amount)) continue;
    const quantity = finiteNumber(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    total += toCents(item.amount) * quantity;
  }
  return total / 100;
};

export function evaluateEligibility(
  coupon: CouponData,
  order: CouponOrderContext = {}
): CouponEligibility {
  const reasons: CouponEligibilityReason[] = [];

  const amount = finiteNumber(order.amount)
    ? order.amount
    : sumItems(order.items);

  // ---- 门槛（分比较；刚好等于视为满足） ----
  const threshold = coupon.threshold;
  let thresholdGap: number | null = null;
  if (finiteNumber(threshold) && threshold > 0) {
    if (amount === null) {
      reasons.push("threshold");
    } else {
      const gapCents = toCents(threshold) - toCents(amount);
      if (gapCents > 0) {
        reasons.push("threshold");
        thresholdGap = gapCents / 100;
      }
    }
  }

  // ---- 有效期 ----
  const validity = computeValidity(coupon, {
    now: () => (finiteNumber(order.now) ? order.now : Date.now()),
    claimedAt: order.claimedAt,
  });
  if (validity?.expired) reasons.push("expired");
  if (validity?.notStarted) reasons.push("not-started");

  // ---- 商品范围 ----
  const scope = coupon.scope;
  const hasScope =
    !!scope &&
    ((scope.sku?.length ?? 0) > 0 ||
      (scope.category?.length ?? 0) > 0 ||
      (scope.excludeSku?.length ?? 0) > 0);
  if (hasScope) {
    const items = order.items ?? [];
    if (items.length === 0) {
      reasons.push("scope");
    } else if (
      scope?.excludeSku?.length &&
      items.some((item) => item.sku && scope.excludeSku!.includes(item.sku))
    ) {
      reasons.push("scope");
    } else {
      const skuList = scope?.sku ?? [];
      const categoryList = scope?.category ?? [];
      if (skuList.length > 0 || categoryList.length > 0) {
        const matched = items.some(
          (item) =>
            (!!item.sku && skuList.includes(item.sku)) ||
            (!!item.category && categoryList.includes(item.category))
        );
        if (!matched) reasons.push("scope");
      }
    }
  }

  // ---- 已选券（排除自身） ----
  const applied = (order.applied ?? []).filter(
    (item) => item && item.id !== coupon.id
  );

  // ---- 互斥组 ----
  if (coupon.exclusiveGroup) {
    const conflict = applied.some(
      (item) => item.exclusiveGroup === coupon.exclusiveGroup
    );
    if (conflict) reasons.push("exclusive");
  }

  // ---- 叠加规则 ----
  if (applied.length > 0 && coupon.stackable !== true) {
    reasons.push("stackable");
  }

  // ---- 限领 ----
  if (resolveQuota(coupon, { purchasedCount: order.purchasedCount }).reached) {
    reasons.push("quota");
  }

  // ---- 库存 ----
  if (resolveStock(coupon).soldout) {
    reasons.push("soldout");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    thresholdGap,
    amount,
  };
}
