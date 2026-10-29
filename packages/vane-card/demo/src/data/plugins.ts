/**
 * 插件注册表（插件工坊的数据源）
 *
 * 三个来源，各管一件事，不允许任何一处手抄漂移：
 *  1. `doc.json`      —— 描述 / 配置表 / 能做什么 / 坑位（文档真相）
 *  2. `index.ts(x)`   —— 用 `?raw` 读源码取 `priority`（工坊按真实执行顺序排）
 *  3. 本文件的 `make` —— 唯一手写部分：每个工厂一份「演示用配置」
 *     22 个工厂的签名差异很大（有的必填对象、有的必填函数），没法自动生成。
 *
 * 分组与实现桶（custom-plugins/index.ts）一致：media / buy / display / interaction / infra。
 */
import type { CardPlugin } from "vane-card";
import {
  createA11yPlugin,
  createActionsPlugin,
  createAnalyticsPlugin,
  createAnimationPlugin,
  createBadgePlugin,
  createComparePricePlugin,
  createCountdownPlugin,
  createCouponPlugin,
  createCouponRecommendPlugin,
  createGalleryPlugin,
  createHoverPlugin,
  createImagePlugin,
  createInventoryPlugin,
  createOrderSummaryPlugin,
  createPriceCalculatorPlugin,
  createQuantityPlugin,
  createResponsivePlugin,
  createReviewPlugin,
  createSKUPlugin,
  createStatePlugin,
  createUserTagPlugin,
  createVideoPlugin,
} from "vane-card/custom-plugins";
import type { SKUAttribute, SKUVariant } from "vane-card/custom-plugins/SKUPlugin";
import { svgImage } from "./images";
import { skuVariantsOf, TEE } from "./seed";

export type PluginGroup = "media" | "buy" | "display" | "interaction" | "infra";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  media: "媒体",
  buy: "交易",
  display: "展示",
  interaction: "交互",
  infra: "基础设施",
};

export const GROUP_ORDER: PluginGroup[] = ["media", "buy", "display", "interaction", "infra"];

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: Array<{ name: string; type: string; default: string; description: string }>;
  example?: string;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginInfo {
  /** 目录名 == 插件 name，如 SKUPlugin */
  dir: string;
  /** 工厂名，如 createSKUPlugin */
  factory: string;
  group: PluginGroup;
  /** 从源码里读出来的真实 priority */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 工坊里勾选后用它装配 */
  make: () => CardPlugin;
}

const DOCS = import.meta.glob<PluginDocShape>(
  "/src/custom-plugins/*/doc.json",
  { eager: true, import: "default" }
);
const RAW_TS = import.meta.glob<string>("/src/custom-plugins/*/create.ts", {
  eager: true,
  query: "?raw",
  import: "default",
});
const RAW_TSX = import.meta.glob<string>("/src/custom-plugins/*/create.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});
const RAW = { ...RAW_TS, ...RAW_TSX };

const dirOf = (path: string) => path.replace(/^.*\/custom-plugins\//, "").replace(/\/.*$/, "");

function priorityOf(dir: string): number {
  const path = Object.keys(RAW).find((p) => dirOf(p) === dir);
  const src = path ? RAW[path] : "";
  const m = /priority:\s*(\d+)/.exec(src);
  return m ? Number(m[1]) : 0;
}

function docOf(dir: string): PluginDocShape {
  const path = Object.keys(DOCS).find((p) => dirOf(p) === dir);
  return path ? DOCS[path] : { name: dir, description: "（缺少 doc.json）" };
}

/** 工坊预览用的图（比商品主图小一号，卡片窄） */
const demoImages = [
  svgImage({ label: "主图", width: 600, height: 450, hue: 96 }),
  svgImage({ label: "细节", width: 600, height: 450, hue: 112 }),
  svgImage({ label: "场景", width: 600, height: 450, hue: 84 }),
];

const COUPONS = [
  { code: "NEW30", discount: 30, minAmount: 199, expiry: new Date(Date.now() + 7 * 864e5) },
  { code: "VIP50", discount: 50, minAmount: 399, expiry: new Date(Date.now() + 30 * 864e5) },
  { code: "FREESHIP", discount: 12, minAmount: 99 },
];

type Def = { dir: string; group: PluginGroup; make: () => CardPlugin };

const DEFS: Def[] = [
  // ---------- media ----------
  { dir: "ImagePlugin", group: "media", make: () => createImagePlugin({ alt: TEE.title }) },
  {
    dir: "VideoPlugin",
    group: "media",
    make: () => createVideoPlugin({ src: "", poster: demoImages[2], muted: true, controls: true }),
  },
  {
    dir: "GalleryPlugin",
    group: "media",
    make: () => createGalleryPlugin({ images: demoImages, showThumbnails: true, showIndicators: true }),
  },

  // ---------- buy ----------
  {
    dir: "SKUPlugin",
    group: "buy",
    make: () =>
      createSKUPlugin({
        attributes: TEE.attributes as SKUAttribute[],
        variants: skuVariantsOf(TEE) as SKUVariant[],
      }),
  },
  { dir: "QuantityPlugin", group: "buy", make: () => createQuantityPlugin({ min: 1, step: 1, useVariantStock: true }) },
  {
    dir: "PriceCalculatorPlugin",
    group: "buy",
    make: () =>
      createPriceCalculatorPlugin({
        showDiscount: true,
        showSavings: true,
        showTotalPrice: true,
        showSavingsBadgeInPriceArea: true,
      }),
  },
  {
    dir: "ComparePricePlugin",
    group: "buy",
    make: () =>
      createComparePricePlugin({
        competitors: [
          { name: "线下专柜", price: 399 },
          { name: "某电商", price: 288 },
          { name: "官方旗舰", price: 319 },
        ],
        showLowestPrice: true,
        highlightLowerThanOurPrice: true,
        sortBy: "price",
        sortOrder: "asc",
      }),
  },
  { dir: "CouponPlugin", group: "buy", make: () => createCouponPlugin({ coupons: COUPONS }) },
  {
    dir: "CouponRecommendPlugin",
    group: "buy",
    make: () => createCouponRecommendPlugin({ coupons: COUPONS, autoApplyBest: true }),
  },
  {
    dir: "OrderSummaryPlugin",
    group: "buy",
    make: () =>
      createOrderSummaryPlugin({ showBreakdown: true, showShipping: true, shippingFee: 12, taxRate: 0.06 }),
  },
  { dir: "InventoryPlugin", group: "buy", make: () => createInventoryPlugin({ lowStockThreshold: 10 }) },

  // ---------- display ----------
  { dir: "BadgePlugin", group: "display", make: () => createBadgePlugin({ text: "甄选", type: "premium", position: "top-left" }) },
  {
    dir: "UserTagPlugin",
    group: "display",
    make: () =>
      createUserTagPlugin({
        tags: [
          { label: "88VIP", color: "#b4553c" },
          { label: "回购 3 次", color: "#6b7245" },
        ],
        maxTags: 2,
      }),
  },
  { dir: "CountdownPlugin", group: "display", make: () => createCountdownPlugin({ durationMs: 3 * 3600e3, prefix: "⏰" }) },
  { dir: "ReviewPlugin", group: "display", make: () => createReviewPlugin({ showRating: true, showReviewCount: true }) },
  { dir: "AnimationPlugin", group: "display", make: () => createAnimationPlugin() },

  // ---------- interaction ----------
  { dir: "ActionsPlugin", group: "interaction", make: () => createActionsPlugin({ showCartButton: true, showWishlistButton: true }) },
  { dir: "HoverPlugin", group: "interaction", make: () => createHoverPlugin({ enableScale: true, enableShadow: true }) },

  // ---------- infra ----------
  { dir: "StatePlugin", group: "infra", make: () => createStatePlugin({ enableCart: true, enableWishlist: true }) },
  {
    dir: "AnalyticsPlugin",
    group: "infra",
    make: () => createAnalyticsPlugin({ transport: () => {} , minExposureMs: 600 }),
  },
  { dir: "A11yPlugin", group: "infra", make: () => createA11yPlugin({ keyboardNavigation: true, announceOnFocus: true }) },
  { dir: "ResponsivePlugin", group: "infra", make: () => createResponsivePlugin() },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir}`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    make: def.make,
  };
}).sort(
  (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || b.priority - a.priority
);

export const byDir = new Map(PLUGINS.map((p) => [p.dir, p]));

/**
 * 互斥 / 需要留意的组合。
 *
 * 判据只有一条：同时装上之后，用户会「看起来能用但其实不生效」。
 * 单纯的功能叠加不算冲突（那是配方的职责）。
 */
export const CONFLICTS: Array<{ a: string; b: string; why: string }> = [
  {
    a: "ImagePlugin",
    b: "GalleryPlugin",
    why: "两者都渲染主媒体区，Gallery 会盖掉 Image（图还在，但你看不到 Image 的兜底逻辑）",
  },
  {
    a: "BadgePlugin",
    b: "CountdownPlugin",
    why: "两者都画在 overlay 的 top-right、偏移都是 8px、zIndex 都是 10 —— 完全重叠。改 position 才能共存",
  },
  {
    a: "AnimationPlugin",
    b: "HoverPlugin",
    why: "都在写容器的 transform：入场动画命令式写内联样式，悬停靠 transformProps 注入，后写者覆盖先写者",
  },
  {
    a: "QuantityPlugin",
    b: "SKUPlugin",
    why: "不算错，但数量上限依赖规格库存：不同时选规格，max 会退回商品级库存，看起来像「上限没生效」",
  },
];

/** 工坊默认勾选：够撑起一张完整的商品卡，又不至于互相打架 */
export const DEFAULT_ON = [
  "ImagePlugin",
  "BadgePlugin",
  "PriceCalculatorPlugin",
  "ActionsPlugin",
  "HoverPlugin",
];
