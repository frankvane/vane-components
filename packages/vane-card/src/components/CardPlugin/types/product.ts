/**
 * 商品数据类型（复合组件的公共契约）
 *
 * 复合组件（38 个）全部通过 `useProductCard()` 读同一份 data，因此这里的字段
 * 就是「`<ProductCard data={...}>` 允许传什么」的唯一真相。所有字段可选：
 * 缺哪个就只是对应组件不渲染 / 走默认值，不会抛错。
 *
 * 末尾的索引签名是刻意的：真实业务数据往往带一堆与渲染无关的字段（id、类目、
 * 后台标记…），如果类型收得太死，调用方只能 `data={x as any}`，等于没类型。
 */

import type React from "react";

/** 一个可购买的规格组合（SKU） */
export interface ProductVariant {
  /** 内部 id */
  id?: string;
  /** 商家编码 */
  sku?: string;
  price?: number;
  oldPrice?: number;
  image?: string;
  /** 视频/主媒体地址（与 image 同义的历史字段） */
  media?: string;
  /** 该变体库存；缺失表示未知 */
  stock?: number;
  /**
   * 规格组合。历史数据里 `options` 与 `attributes` 两种键名都出现过，
   * 读取一律走 {@link variantOptionsOf}，不要直接取字段。
   */
  options?: Record<string, string | number>;
  attributes?: Record<string, string | number>;
}

/** 复合组件读取的商品字段 */
export interface ProductData {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  images?: string[];
  price?: number;
  oldPrice?: number;
  /** 总体库存（无变体时用） */
  inventory?: number;
  sku?: string;
  brand?: string;
  badge?: string;
  badges?: string[];
  tags?: string[];
  features?: string[];
  specs?: Record<string, React.ReactNode> | Array<{ key: string; value: React.ReactNode }>;
  /** 颜色色板：支持 `["红","蓝"]` 简写或 `{ name, hex }` 完整形态 */
  colors?: Array<{ name: string; hex: string }> | string[];
  sizes?: string[];
  /**
   * 规格数据，两种历史形态都支持：
   * - 数组：`[{ options: { 颜色: "红" }, price, stock }]`
   * - 映射：`{ 颜色: ["红", "蓝"] }`（等价于直接给属性选项集）
   */
  variants?: ProductVariant[] | Record<string, string[]>;
  rating?: number;
  ratingCount?: number;
  shipping?: string;
  shippingInfo?: string;
  warranty?: string;
  /** 净重（克），PricePerUnit 用 */
  weightGram?: number;
  /** 单位重量（公斤），ShippingEstimator 用 */
  unitWeight?: number;
  [key: string]: unknown;
}

/** 已选规格：属性名 → 选中值 */
export type ProductAttributes = Record<string, string>;

/** 取变体的规格组合，兼容 `options` / `attributes` 两种历史键名 */
export function variantOptionsOf(variant: ProductVariant): Record<string, string | number> {
  return variant.options ?? variant.attributes ?? {};
}

/** `data.variants` 的数组形态；映射形态（属性集）返回 undefined */
export function variantListOf(data: ProductData | undefined): ProductVariant[] | undefined {
  const variants = data?.variants;
  return Array.isArray(variants) ? variants : undefined;
}

/** `data.variants` 的映射形态；数组形态返回 undefined */
export function attributeMapOf(data: ProductData | undefined): Record<string, string[]> | undefined {
  const variants = data?.variants;
  if (!variants || Array.isArray(variants)) return undefined;
  return variants;
}

/**
 * 在 variants 里找与当前已选属性**完全匹配**的那一条。
 *
 * "完全"是刻意的：变体声明的属性集必须与已选属性集一一对上。
 * 只选了颜色还没选尺码时返回 undefined，调用方于是回退到商品级字段，
 * 而不是拿一个「颜色对了但尺码没选」的变体价格顶上 —— 那会显示错的价。
 */
export function matchVariant(
  variants: ProductVariant[] | undefined,
  attributes: ProductAttributes | undefined
): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  const attrs = attributes ?? {};
  const keys = Object.keys(attrs);
  if (!keys.length) return undefined;

  return variants.find((variant) => {
    const opts = variantOptionsOf(variant);
    // 属性集大小必须相等：既排除"只选了一部分"，也排除"变体多了没选的属性"
    if (Object.keys(opts).length !== keys.length) return false;
    return keys.every((key) => String(opts[key]) === String(attrs[key]));
  });
}
