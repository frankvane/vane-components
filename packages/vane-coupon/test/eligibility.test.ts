import { describe, expect, it } from "vitest";
import {
  computeValidity,
  evaluateEligibility,
  formatAmount,
  resolveQuota,
  resolveStock,
  resolveThreshold,
} from "../src";
import type { CouponData } from "../src";

const DAY = 24 * 60 * 60 * 1000;
const base: CouponData = { id: "c1", title: "判定券", amount: 10 };

// ============ CP-P1-5 门槛 ============

describe("evaluateEligibility · 门槛（分比较）", () => {
  it("刚好等于门槛视为满足；差 1 分判不满足并给出差额", () => {
    const equal = evaluateEligibility(baseCoupon({ threshold: 199 }), {
      amount: 199,
    });
    expect(equal.eligible).toBe(true);
    expect(equal.reasons).toEqual([]);
    expect(equal.thresholdGap).toBeNull();

    const below = evaluateEligibility(baseCoupon({ threshold: 199 }), {
      amount: 198.99,
    });
    expect(below.eligible).toBe(false);
    expect(below.reasons).toContain("threshold");
    expect(below.thresholdGap).toBe(0.01);
  });

  it("浮点金额按分累加，不被 0.1 + 0.2 误判", () => {
    const result = evaluateEligibility(baseCoupon({ threshold: 0.3 }), {
      items: [{ amount: 0.1 }, { amount: 0.2 }],
    });
    expect(result.eligible).toBe(true);
    expect(result.amount).toBeCloseTo(0.3, 5);
  });

  it("无金额可核对时按保守口径判不满足；threshold 缺省/0 视为无门槛", () => {
    const unknown = evaluateEligibility(baseCoupon({ threshold: 199 }), {});
    expect(unknown.reasons).toContain("threshold");
    expect(unknown.thresholdGap).toBeNull();

    expect(evaluateEligibility(baseCoupon({ threshold: 0 }), {}).eligible).toBe(true);
    expect(evaluateEligibility(baseCoupon({}), {}).eligible).toBe(true);
  });

  it("0 元券（amount=0）不影响可用性判定", () => {
    const zero = evaluateEligibility(
      { ...base, amount: 0, threshold: 0 },
      { amount: 0 }
    );
    expect(zero.eligible).toBe(true);
  });
});

// ============ CP-P1-5 有效期 ============

describe("evaluateEligibility · 有效期边界", () => {
  const NOW = 1_700_000_000_000;

  it("validTo 当刻仍有效，+1ms 才过期", () => {
    const coupon = baseCoupon({ validTo: NOW });
    expect(computeValidity(coupon, { now: () => NOW })?.expired).toBe(false);
    expect(computeValidity(coupon, { now: () => NOW + 1 })?.expired).toBe(true);

    expect(
      evaluateEligibility(coupon, { now: NOW + 1 }).reasons
    ).toContain("expired");
  });

  it("validFrom 当刻即已开始，前一毫秒为未开始", () => {
    const coupon = baseCoupon({
      validFrom: NOW,
      validTo: NOW + DAY,
    });
    expect(
      computeValidity(coupon, { now: () => NOW })?.notStarted
    ).toBe(false);
    expect(
      computeValidity(coupon, { now: () => NOW - 1 })?.notStarted
    ).toBe(true);
    expect(
      evaluateEligibility(coupon, { now: NOW - 1 }).reasons
    ).toContain("not-started");
  });
});

// ============ CP-P1-5 商品范围 ============

describe("evaluateEligibility · 商品范围", () => {
  it("sku 白名单命中可用；未命中 / 无订单行判 scope", () => {
    const coupon = baseCoupon({ scope: { sku: ["A"] } });
    expect(
      evaluateEligibility(coupon, { items: [{ sku: "A", amount: 10 }] }).eligible
    ).toBe(true);
    expect(
      evaluateEligibility(coupon, { items: [{ sku: "B", amount: 10 }] }).reasons
    ).toContain("scope");
    expect(evaluateEligibility(coupon, {}).reasons).toContain("scope");
  });

  it("category 白名单与 excludeSku 黑名单", () => {
    const byCategory = baseCoupon({ scope: { category: ["生鲜"] } });
    expect(
      evaluateEligibility(byCategory, {
        items: [{ category: "生鲜", amount: 10 }],
      }).eligible
    ).toBe(true);

    const excluded = baseCoupon({ scope: { excludeSku: ["X"] } });
    expect(
      evaluateEligibility(excluded, { items: [{ sku: "X", amount: 10 }] })
        .reasons
    ).toContain("scope");
    expect(
      evaluateEligibility(excluded, { items: [{ sku: "Y", amount: 10 }] })
        .eligible
    ).toBe(true);
  });
});

// ============ CP-P1-5 互斥 / 叠加 ============

describe("evaluateEligibility · 互斥组与叠加", () => {
  it("同互斥组且不同券 → exclusive；已选自身不算冲突", () => {
    const coupon = baseCoupon({ exclusiveGroup: "g1" });
    expect(
      evaluateEligibility(coupon, {
        applied: [{ id: "other", exclusiveGroup: "g1" }],
      }).reasons
    ).toContain("exclusive");
    expect(
      evaluateEligibility(coupon, {
        applied: [{ id: coupon.id, exclusiveGroup: "g1" }],
      }).eligible
    ).toBe(true);
  });

  it("已选其它券且未声明可叠加 → stackable；stackable=true 放行", () => {
    expect(
      evaluateEligibility(couponOf(), {
        applied: [{ id: "other" }],
      }).reasons
    ).toContain("stackable");

    expect(
      evaluateEligibility(baseCoupon({ stackable: true }), {
        applied: [{ id: "other" }],
      }).eligible
    ).toBe(true);
  });
});

// ============ CP-P1-1 / CP-P1-2 库存与限领 ============

describe("resolveStock · 并集口径", () => {
  it("claimed 达到 total 即 soldout（进度条与按钮同一事实）", () => {
    const stock = resolveStock(baseCoupon({ total: 10, claimed: 10 }));
    expect(stock.soldout).toBe(true);
    expect(stock.percent).toBe(100);
    expect(stock.remaining).toBe(0);
  });

  it("stock ≤ 0 与 total/claimed 任一成立即 soldout", () => {
    expect(
      resolveStock(baseCoupon({ total: 10, claimed: 3 }), { stock: 0 }).soldout
    ).toBe(true);
    expect(
      resolveStock(baseCoupon({ total: 10, claimed: 3 })).soldout
    ).toBe(false);
  });

  it("剩余取 stock 与 total - claimed 的较小值", () => {
    expect(
      resolveStock(baseCoupon({ total: 10, claimed: 3 }), { stock: 5 }).remaining
    ).toBe(5);
    expect(
      resolveStock(baseCoupon({ total: 10, claimed: 3 }), { stock: 20 }).remaining
    ).toBe(7);
  });

  it("claimed 超过 total 时百分比封顶 100", () => {
    const stock = resolveStock(baseCoupon({ total: 10, claimed: 12 }));
    expect(stock.percent).toBe(100);
    expect(stock.soldout).toBe(true);
  });
});

describe("resolveQuota · 限领口径", () => {
  it("purchased >= quota 即 reached；quota=0 任何已领数都超限", () => {
    expect(resolveQuota(baseCoupon({ quota: 2 }), { purchasedCount: 2 }).reached).toBe(true);
    expect(resolveQuota(baseCoupon({ quota: 2 }), { purchasedCount: 1 }).reached).toBe(false);
    expect(resolveQuota(baseCoupon({ quota: 0 }), { purchasedCount: 0 }).reached).toBe(true);
    expect(resolveQuota(baseCoupon({}), { purchasedCount: 5 }).reached).toBe(false);
  });
});

// ============ CP-P2-3 面额 / 门槛格式化 ============

describe("formatAmount / resolveThreshold", () => {
  it("cash 固定两位；discount 去多余 0（含 100% 折扣与 0 元券）", () => {
    expect(formatAmount(10)).toBe("10.00");
    expect(formatAmount(10.5)).toBe("10.50");
    expect(formatAmount(0)).toBe("0.00");
    expect(formatAmount(8.5, "discount")).toBe("8.5");
    expect(formatAmount(10, "discount")).toBe("10");
    expect(formatAmount(0, "discount")).toBe("0");
  });

  it("非有限面额走兜底文案「—」", () => {
    expect(formatAmount(Number.NaN)).toBe("—");
    expect(formatAmount(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatAmount("10.00")).toBe("—");
  });

  it("门槛：未声明/0 为无门槛；负数与非有限值归为非法数据", () => {
    expect(resolveThreshold(undefined).state).toBe("none");
    expect(resolveThreshold(0).state).toBe("none");
    expect(resolveThreshold(99).text).toBe("满99可用");
    expect(resolveThreshold(99.9).text).toBe("满99.9可用");
    expect(resolveThreshold(Number.NaN).state).toBe("invalid");
    expect(resolveThreshold(-5).state).toBe("invalid");
  });
});

/** 构造券面：base 上叠加字段（保持 id/title/amount） */
function baseCoupon(extra: Partial<CouponData>): CouponData {
  return { ...base, ...extra };
}

/** 互斥用例里「已选其它券」的底券（无互斥组 / 无可叠加声明） */
function couponOf(): CouponData {
  return { ...base };
}
