import type { SkuVariant } from "./plugins/types";

/**
 * 数量 / 价格口径的共用实现（P1-3 / P2-2）。
 *
 * Quota（是否可买）与 Quantity（能买几件）必须用同一套「剩余可购」定义，
 * 否则会出现「限购 2、已购 1，还能再加 2 件」这种规则漏洞。
 */

/**
 * 每人剩余可购件数。
 * 未声明 quota 视为不限购（返回 Infinity）；已超限时归零（不返回负数）。
 */
export function remainingQuota(
  quota: number | undefined,
  purchasedCount = 0
): number {
  if (typeof quota !== "number") return Infinity;
  const purchased = Math.max(0, purchasedCount);
  return Math.max(0, quota - purchased);
}

/**
 * 数量上限 = min(库存, 剩余可购, config.max)。
 * 任一维度缺省视为不限；变体缺失时上限为 0（不渲染步进器）。
 */
export function quantityUpper(
  variant: SkuVariant | null | undefined,
  opts: { purchasedCount?: number; max?: number } = {}
): number {
  if (!variant) return 0;
  const byStock = typeof variant.stock === "number" ? variant.stock : Infinity;
  const byQuota = remainingQuota(variant.quota, opts.purchasedCount ?? 0);
  return Math.min(byStock, byQuota, opts.max ?? Infinity);
}

/** 价格数值格式化：固定两位小数，缺省 / 非有限值兜底为 "0.00" */
export function formatPriceValue(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

/** 价格展示：货币符号 + 两位小数 */
export function formatPrice(
  value: number | null | undefined,
  currency = "¥"
): string {
  return `${currency}${formatPriceValue(value)}`;
}
