import type { SkuAttribute, SkuVariant } from "../../../src";

/**
 * 演示用样例数据（多页共用）。
 *
 * 刻意在矩阵里留洞：
 *  - 缺 blue-l：选蓝色后「L」应被禁用推导置灰
 *  - green-l 库存 0：用于演示 ignoreOutOfStock
 *  - red-s 带 quota 2：用于演示限购与数量上限
 */
export const ATTRIBUTES: SkuAttribute[] = [
  {
    name: "颜色",
    options: [
      { id: "red", label: "红", image: swatch("#d4380d") },
      { id: "blue", label: "蓝", image: swatch("#2b7de9") },
      { id: "green", label: "绿", image: swatch("#389e0d") },
    ],
  },
  {
    name: "尺码",
    options: [
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
  },
];

export const VARIANTS: SkuVariant[] = [
  { sku: "TEE-RED-S", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, originalPrice: 299, stock: 5, quota: 2, image: pic("red-s") },
  { sku: "TEE-RED-M", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, originalPrice: 299, stock: 3, image: pic("red-m") },
  { sku: "TEE-RED-L", attrValues: { 颜色: "red", 尺码: "l" }, price: 239, stock: 4, image: pic("red-l") },
  { sku: "TEE-BLUE-S", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8, image: pic("blue-s") },
  { sku: "TEE-BLUE-M", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6, image: pic("blue-m") },
  // blue-l 不存在 → 选蓝后 L 置灰
  { sku: "TEE-GREEN-M", attrValues: { 颜色: "green", 尺码: "m" }, price: 249, stock: 2, image: pic("green-m") },
  { sku: "TEE-GREEN-L", attrValues: { 颜色: "green", 尺码: "l" }, price: 269, stock: 0, image: pic("green-l") },
];

/** 内联 SVG 色块，避免演示站依赖外网图片 */
function swatch(color: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" rx="3" fill="${color}"/></svg>`
  )}`;
}

function pic(seed: string): string {
  return `https://picsum.photos/seed/${seed}/240/240`;
}
