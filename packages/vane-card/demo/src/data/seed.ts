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

/* ==========================================================================
 * 行业示例数据
 *
 * 「通用电商」那套数据（服饰 / 杯子 / 椅子）看不出行业差别：生鲜要「称重 +
 * 时效」，3C 要「版本 + 以旧换新」，票务要「场次 + 票档」。这几件是按行业
 * 挑的，字段也按行业真实形状给（票务的 inventory 是「剩余张数」，
 * 生鲜的 attributes 是重量而不是颜色）。
 * ========================================================================== */

/** 生鲜：规格就是重量，库存按份算，时效是核心卖点 */
export const MANGO: SeedProduct = {
  id: "p-mango",
  short: "小台芒",
  title: "云南小台芒 · 树上熟",
  subtitle: "当日采摘 · 冷链直发 · 坏果包赔",
  price: 29.9,
  oldPrice: 39.9,
  image: svgImage({ label: "小台芒", hue: 42 }),
  images: [svgImage({ label: "整箱", hue: 42 }), svgImage({ label: "果肉", hue: 48 })],
  inventory: 7,
  tags: ["今日达", "冷链", "坏果包赔"],
  rating: 4.7,
  ratingCount: 3412,
  features: ["树上熟，甜度 18°+", "冷链直发，24h 到家", "坏果包赔，拍照即退"],
  description: "云南元江小台芒，树上熟到 8 分才摘。冷链直发，24 小时内到。坏果拍照即赔，不用寄回。",
  brand: "山野鲜",
  skuCode: "SY-MANGO",
  specs: [
    { key: "产地", value: "云南 · 元江" },
    { key: "甜度", value: "18° 以上" },
    { key: "时效", value: "24 小时达" },
  ],
  variants: [
    { sku: "MGO-500", options: { 规格: "500g" }, price: 29.9, stock: 7 },
    { sku: "MGO-1K", options: { 规格: "1kg" }, price: 52, stock: 12 },
    { sku: "MGO-2K", options: { 规格: "2kg" }, price: 96, stock: 3 },
  ],
  attributes: [{ name: "规格", options: ["500g", "1kg", "2kg"] }],
};

/** 3C：版本组合 + 参数表 + 以旧换新（比价插件的用武之处） */
export const BUDS: SeedProduct = {
  id: "p-buds",
  short: "降噪耳机",
  title: "主动降噪耳机 · 42dB 深度",
  subtitle: "双设备连接 · 单次 8 小时 · 支持无线充",
  price: 899,
  oldPrice: 1099,
  image: svgImage({ label: "降噪耳机", hue: 232 }),
  images: [svgImage({ label: "充电盒", hue: 232 }), svgImage({ label: "佩戴", hue: 240 })],
  inventory: 36,
  tags: ["降噪", "双设备", "无线充"],
  rating: 4.5,
  ratingCount: 8921,
  features: ["42dB 主动降噪", "双设备无缝切换", "单次 8 小时 / 总计 32 小时"],
  description: "42dB 主动降噪，通勤地铁里能压掉大半低频。双设备连接，手机和电脑之间自动切。",
  brand: "VANE AUDIO",
  skuCode: "VA-BUDS-42",
  specs: [
    { key: "降噪深度", value: "42dB" },
    { key: "续航", value: "8h / 32h（含盒）" },
    { key: "蓝牙", value: "5.4 · 双设备" },
    { key: "充电", value: "USB-C / 无线" },
  ],
  variants: [
    { sku: "BUDS-BK-STD", options: { 颜色: "曜石黑", 套装: "标准" }, price: 899, stock: 20, image: svgImage({ label: "曜石黑", hue: 220 }) },
    { sku: "BUDS-BK-PRO", options: { 颜色: "曜石黑", 套装: "充电盒套装" }, price: 1049, stock: 12, image: svgImage({ label: "曜石黑 / 套装", hue: 220 }) },
    { sku: "BUDS-WH-STD", options: { 颜色: "雾白", 套装: "标准" }, price: 899, stock: 4, image: svgImage({ label: "雾白", hue: 210 }) },
    { sku: "BUDS-WH-PRO", options: { 颜色: "雾白", 套装: "充电盒套装" }, price: 1049, stock: 0, image: svgImage({ label: "雾白 / 套装", hue: 210 }) },
  ],
  attributes: [
    { name: "颜色", options: ["曜石黑", "雾白"] },
    { name: "套装", options: ["标准", "充电盒套装"] },
  ],
  colors: [
    { name: "曜石黑", hex: "#2b2f36" },
    { name: "雾白", hex: "#e8e6e1" },
  ],
};

/** 美妆：色号就是 SKU，主图必须跟着色号换 */
export const LIPSTICK: SeedProduct = {
  id: "p-lip",
  short: "丝绒唇釉",
  title: "丝绒雾面唇釉 · 4.5g",
  subtitle: "不拔干 · 不挂杯 · 三层显色",
  price: 129,
  oldPrice: 159,
  image: svgImage({ label: "丝绒唇釉", hue: 348 }),
  images: [
    svgImage({ label: "#01 干枯玫瑰", hue: 348 }),
    svgImage({ label: "#04 冰糖山楂", hue: 8 }),
    svgImage({ label: "#07 肉桂奶茶", hue: 28 }),
  ],
  inventory: 52,
  tags: ["雾面", "不拔干", "显色"],
  rating: 4.6,
  ratingCount: 15802,
  features: ["雾面但不拔干", "不挂杯，喝水不掉色", "三层薄涂即显色"],
  description: "雾面质地但不拔干，加了 3% 角鲨烷。薄涂三层就能盖住唇色，喝水不挂杯。",
  brand: "VANE BEAUTY",
  skuCode: "VB-LIP",
  specs: [
    { key: "净含量", value: "4.5g" },
    { key: "妆效", value: "丝绒雾面" },
    { key: "保质期", value: "3 年" },
  ],
  variants: [
    { sku: "LIP-01", options: { 色号: "#01 干枯玫瑰" }, price: 129, stock: 24, image: svgImage({ label: "#01 干枯玫瑰", hue: 348 }) },
    { sku: "LIP-04", options: { 色号: "#04 冰糖山楂" }, price: 129, stock: 18, image: svgImage({ label: "#04 冰糖山楂", hue: 8 }) },
    { sku: "LIP-07", options: { 色号: "#07 肉桂奶茶" }, price: 129, stock: 10, image: svgImage({ label: "#07 肉桂奶茶", hue: 28 }) },
  ],
  attributes: [{ name: "色号", options: ["#01 干枯玫瑰", "#04 冰糖山楂", "#07 肉桂奶茶"] }],
  colors: [
    { name: "#01 干枯玫瑰", hex: "#a8606a" },
    { name: "#04 冰糖山楂", hex: "#b23a35" },
    { name: "#07 肉桂奶茶", hex: "#b0806a" },
  ],
};

/** 家居：尺寸 + 送装是决策核心，价格之后才是这些 */
export const LAMP: SeedProduct = {
  id: "p-lamp",
  short: "落地灯",
  title: "极简落地灯 · 三档色温",
  subtitle: "160cm · 无极调光 · 包安装",
  price: 599,
  oldPrice: 799,
  image: svgPortrait("落地灯", "160cm"),
  images: [svgPortrait("整灯", "160cm"), svgPortrait("灯头", "调光")],
  inventory: 15,
  tags: ["包安装", "无极调光", "三色温"],
  rating: 4.4,
  ratingCount: 623,
  features: ["三档色温 3000/4000/5000K", "无极调光，最低 1% 不闪", "大件送装一体，师傅上门"],
  description: "160cm 落地灯，三档色温 + 无极调光。大件送装一体，师傅送货上门并安装。",
  brand: "VANE HOME",
  skuCode: "VH-LAMP-160",
  specs: [
    { key: "高度", value: "160cm" },
    { key: "功率", value: "18W LED" },
    { key: "色温", value: "3000 / 4000 / 5000K" },
    { key: "配送", value: "送装一体（3–5 天）" },
  ],
  variants: [
    { sku: "LAMP-160-BK", options: { 尺寸: "160cm", 颜色: "哑光黑" }, price: 599, stock: 9 },
    { sku: "LAMP-160-WH", options: { 尺寸: "160cm", 颜色: "米白" }, price: 599, stock: 6 },
    { sku: "LAMP-140-BK", options: { 尺寸: "140cm", 颜色: "哑光黑" }, price: 499, stock: 0 },
  ],
  attributes: [
    { name: "尺寸", options: ["140cm", "160cm"] },
    { name: "颜色", options: ["哑光黑", "米白"] },
  ],
};

/** 票务：SKU = 场次 × 票档，库存是「剩余张数」，还有开票倒计时 */
export const TICKET: SeedProduct = {
  id: "p-ticket",
  short: "话剧票",
  title: "话剧《夜市》· 上海场",
  subtitle: "2026 巡演 · 105 分钟 · 中场无休",
  price: 280,
  image: svgImage({ label: "夜市", hue: 268 }),
  images: [svgImage({ label: "剧照 01", hue: 268 }), svgImage({ label: "剧照 02", hue: 280 })],
  inventory: 46,
  tags: ["话剧", "上海", "可选座"],
  rating: 4.8,
  ratingCount: 1290,
  features: ["105 分钟，中场无休", "可选座，出票即锁定座位", "开演前 48 小时可退"],
  description: "2026 巡演上海站。105 分钟无中场，建议 12 岁以上观众。可选座，出票即锁定。",
  brand: "VANE THEATRE",
  skuCode: "VT-NIGHT",
  specs: [
    { key: "时长", value: "105 分钟" },
    { key: "场馆", value: "上海 · 兰心大戏院" },
    { key: "退改", value: "开演前 48h 可退" },
  ],
  variants: [
    { sku: "TK-1031-280", options: { 场次: "10-31 19:30", 票档: "280 元" }, price: 280, stock: 20 },
    { sku: "TK-1031-380", options: { 场次: "10-31 19:30", 票档: "380 元" }, price: 380, stock: 12 },
    { sku: "TK-1101-280", options: { 场次: "11-01 14:30", 票档: "280 元" }, price: 280, stock: 9 },
    { sku: "TK-1101-380", options: { 场次: "11-01 14:30", 票档: "380 元" }, price: 380, stock: 5 },
  ],
  attributes: [
    { name: "场次", options: ["10-31 19:30", "11-01 14:30"] },
    { name: "票档", options: ["280 元", "380 元"] },
  ],
};

/** 在线课程：班期是 SKU，试看视频是转化的第一屏 */
export const COURSE: SeedProduct = {
  id: "p-course",
  short: "设计课",
  title: "界面设计系统课 · 第 8 期",
  subtitle: "12 周 · 24 节课 · 作业逐份批改",
  price: 499,
  oldPrice: 899,
  image: svgImage({ label: "设计系统课", hue: 196 }),
  images: [svgImage({ label: "课程封面", hue: 196 }), svgImage({ label: "作业示例", hue: 204 })],
  inventory: 28,
  tags: ["直播", "作业批改", "可试看"],
  rating: 4.9,
  ratingCount: 472,
  features: ["12 周 24 节课，每周一次直播", "每份作业逐份批改", "结课项目写进作品集"],
  description: "12 周系统课，从设计令牌到组件库落地。每周一次直播 + 作业逐份批改，结课产出可写进作品集。",
  brand: "VANE CLASS",
  skuCode: "VC-DS-08",
  specs: [
    { key: "周期", value: "12 周 / 24 节课" },
    { key: "形式", value: "直播 + 回放永久" },
    { key: "服务", value: "作业逐份批改" },
  ],
  variants: [
    { sku: "DS-08-OCT", options: { 班期: "10 月 26 日开班" }, price: 499, stock: 16 },
    { sku: "DS-08-NOV", options: { 班期: "11 月 30 日开班" }, price: 499, stock: 12 },
  ],
  attributes: [{ name: "班期", options: ["10 月 26 日开班", "11 月 30 日开班"] }],
};


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
