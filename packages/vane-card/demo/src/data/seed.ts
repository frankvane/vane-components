/**
 * 演示数据：三个真实感的商品 + 批量生成器。
 *
 * 所有字段都按 `ProductData` 的形状给（`vane-card` 的公开契约），
 * 这样示例里的 `data` 可以原样粘到真实项目里 —— 不会出现「demo 能用、
 * 换成真实数据就缺字段」的情况。
 */
import { svgImage, svgPortrait } from "./images";
import type { ProductData, ProductVariant } from "vane-card";

export interface SeedProduct extends ProductData {
  /** 演示用：场景墙里的短名 */
  short: string;
  /** 二级说明（描述区） */
  description: string;
  brand: string;
  skuCode: string;
  images: string[];
  /** SKU 插件用的属性定义（与 ProductData.variants 的 options 键对应） */
  attributes: Array<{ name: string; options: string[] }>;
}

const TEE_VARIANTS: ProductVariant[] = [
  { sku: "TS-RED-M", options: { 颜色: "赤陶", 尺码: "M" }, price: 319, stock: 3, image: svgImage({ label: "赤陶 / M", width: 600, height: 600, hue: 12 }) },
  { sku: "TS-RED-L", options: { 颜色: "赤陶", 尺码: "L" }, price: 319, stock: 12, image: svgImage({ label: "赤陶 / L", width: 600, height: 600, hue: 12 }) },
  { sku: "TS-OLIVE-M", options: { 颜色: "橄榄", 尺码: "M" }, price: 299, stock: 26, image: svgImage({ label: "橄榄 / M", width: 600, height: 600, hue: 96 }) },
  { sku: "TS-OLIVE-L", options: { 颜色: "橄榄", 尺码: "L" }, price: 299, stock: 0, image: svgImage({ label: "橄榄 / L", width: 600, height: 600, hue: 96 }) },
];

export const TEE: SeedProduct = {
  id: "p-tee",
  short: "长绒棉 T 恤",
  title: "经典圆领 T 恤 · 260g 长绒棉",
  subtitle: "新疆长绒棉 · 双纱领口 · 三色可选",
  price: 299,
  oldPrice: 399,
  image: svgImage({ label: "长绒棉 T 恤", hue: 96 }),
  images: [
    svgImage({ label: "正面", hue: 96 }),
    svgImage({ label: "细节 / 领口", hue: 104 }),
    svgImage({ label: "背面", hue: 88 }),
    svgImage({ label: "上身", hue: 112 }),
  ],
  inventory: 12,
  tags: ["纯棉", "夏季", "基础款"],
  rating: 4.6,
  ratingCount: 1284,
  features: ["不掉色，机洗 30 次色差 < 1 级", "双纱领口，久穿不松", "260g 克重，不透不闷"],
  description:
    "260g 精梳长绒棉，双纱领口加固。肩线落在肩峰内 1cm，视觉收窄。三色都是低饱和土色系，配牛仔或工装都稳。",
  brand: "VANE BASICS",
  skuCode: "VB-TEE-260",
  specs: [
    { key: "面料", value: "100% 新疆长绒棉" },
    { key: "克重", value: "260g/㎡" },
    { key: "版型", value: "宽松直筒" },
    { key: "产地", value: "浙江 · 宁波" },
  ],
  variants: TEE_VARIANTS,
  attributes: [
    { name: "颜色", options: ["赤陶", "橄榄"] },
    { name: "尺码", options: ["M", "L"] },
  ],
  colors: [
    { name: "赤陶", hex: "#b4553c" },
    { name: "橄榄", hex: "#6b7245" },
  ],
};

export const MUG: SeedProduct = {
  id: "p-mug",
  short: "手冲马克杯",
  title: "手冲马克杯 · 300ml 粗陶",
  subtitle: "景德镇粗陶 · 手作釉面 · 每只纹理不同",
  price: 168,
  oldPrice: 219,
  image: svgImage({ label: "粗陶马克杯", hue: 32 }),
  images: [svgImage({ label: "杯身", hue: 32 }), svgImage({ label: "釉面细节", hue: 40 })],
  inventory: 4,
  tags: ["手作", "粗陶"],
  rating: 4.9,
  ratingCount: 236,
  features: ["手作釉面，每只纹理不同", "杯壁 5mm，保温久", "可进洗碗机"],
  description: "景德镇手作粗陶，300ml 容量，杯壁 5mm。窑变釉，每只纹理都不同，收到的那只只属于你。",
  brand: "VANE STUDIO",
  skuCode: "VS-MUG-300",
  attributes: [],
  specs: [
    { key: "容量", value: "300ml" },
    { key: "材质", value: "高温粗陶" },
    { key: "工艺", value: "手作 · 窑变釉" },
  ],
};

export const CHAIR: SeedProduct = {
  id: "p-chair",
  short: "折叠露营椅",
  title: "轻量折叠露营椅 · 铝合金",
  subtitle: "1.9kg · 承重 120kg · 收纳 38cm",
  price: 459,
  oldPrice: 599,
  image: svgPortrait("露营椅", "1.9kg"),
  images: [svgPortrait("椅身", "1.9kg"), svgPortrait("收纳", "38cm")],
  inventory: 48,
  tags: ["户外", "轻量"],
  rating: 4.4,
  ratingCount: 892,
  features: ["7075 铝合金骨架，整椅 1.9kg", "承重 120kg", "收纳后 38cm，可进背包侧袋"],
  description: "7075 铝合金骨架 + 600D 牛津布，整椅 1.9kg，承重 120kg。收起来 38cm，塞背包侧袋就走。",
  brand: "VANE OUTDOOR",
  skuCode: "VO-CHAIR-01",
  attributes: [],
  specs: [
    { key: "重量", value: "1.9kg" },
    { key: "承重", value: "120kg" },
    { key: "收纳长度", value: "38cm" },
  ],
};

export const PRODUCTS: SeedProduct[] = [TEE, MUG, CHAIR];

/** 场景墙：8 个不同商品的「列表卡」数据 */
export function wallProducts(): SeedProduct[] {
  const names = ["帆布托特包", "黄铜书签", "羊毛毡垫", "双肩相机包", "玻璃冷萃壶", "亚麻桌旗", "牛皮卡包", "香樟木托盘"];
  return names.map((name, i) => {
    const base = PRODUCTS[i % PRODUCTS.length];
    return {
      ...base,
      id: `wall-${i}`,
      short: name,
      title: `${name} · 编辑部选品`,
      price: 79 + i * 57,
      oldPrice: i % 3 === 0 ? 129 + i * 57 : undefined,
      image: svgImage({ label: name, hue: (i * 36) % 360 }),
      inventory: [2, 6, 18, 0, 40, 9, 25, 63][i],
      tags: [["手作", "日用", "户外", "通勤"][i % 4]],
      rating: Number((4.1 + (i % 8) * 0.1).toFixed(1)),
      ratingCount: 120 + i * 87,
    };
  });
}

/** 场景墙里用到的「竖版」图，保证 3:4 的固定比例，版式不抖 */
export function wallImages(): string[] {
  return Array.from({ length: 8 }, (_, i) => svgPortrait(`选品 ${i + 1}`, `NO.${String(i + 1).padStart(2, "0")}`));
}

/**
 * ProductVariant → SKUPlugin 的变体形状。
 *
 * 两套形状是历史原因，别合并：ProductData.variants 给复合组件读（键名 options），
 * SKUPlugin 吃的变体用 attrs。这里做一次显式转换，避免示例里到处 as any。
 */
export function skuVariantsOf(product: SeedProduct): Array<{
  sku: string;
  attrs: Record<string, string>;
  price?: number;
  stock?: number;
  image?: string;
}> {
  const list = Array.isArray(product.variants) ? (product.variants as ProductVariant[]) : [];
  return list.map((v) => ({
    sku: v.sku ?? "",
    attrs: (v.options ?? v.attributes ?? {}) as Record<string, string>,
    price: v.price,
    stock: v.stock,
    image: v.image,
  }));
}
