/**
 * BusKeys - 插件总线常用键的集中定义
 * 约束字符串键的使用，避免散落与拼写不一致。
 */

export const BusKeys = {
  // SKU 相关
  skuSelection: "sku.selection",
  skuVariant: "sku.variant",
  skuPrice: "sku.price",
  skuImage: "sku.image",

  // 购买数量
  quantity: "quantity",

  // 优惠券
  couponApplied: "coupon.applied",
} as const;

export type BusKey = typeof BusKeys[keyof typeof BusKeys];