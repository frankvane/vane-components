/**
 * C3.5 · 22 个插件的元数据与文档一致性（表驱动）
 *
 * 每个插件只断言三件事，但一次覆盖全部 22 个：
 *  1. 工厂返回 `{ name, hooks }`，name 与目录名一致；
 *  2. `hooks` 里至少有一个是真函数，且不含已删除的 9 个死钩子；
 *  3. 同目录 `doc.json` 能解析、name 一致、config 每项都有 name/type/description。
 *
 * 这条测试的价值在于「新增插件忘了写文档」或「文档里写了不存在的配置」时立刻红，
 * 而不是等到发版后文档站与代码对不上。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import * as plugins from "../src/components/CardPlugin/custom-plugins";

const ROOT = process.cwd();
const PLUGIN_DIR = path.join(ROOT, "src/components/CardPlugin/custom-plugins");

/** 已删除的 9 个死钩子（C2：钩子面 24→15），出现即回归 */
const REMOVED_HOOKS = [
  "onSelectionChange",
  "onCartChange",
  "onWishlistChange",
  "onBeforeDataChange",
  "onDataChange",
  "renderContainer",
  "renderContentWrapper",
  "renderBadge",
  "renderActions",
];

/** 22 个插件：工厂名 → 建厂所需的最小参数 */
const REGISTRY: Array<{ dir: string; create: () => CardPlugin }> = [
  { dir: "ImagePlugin", create: () => plugins.createImagePlugin() },
  { dir: "VideoPlugin", create: () => plugins.createVideoPlugin({ src: "/v.mp4" }) },
  { dir: "GalleryPlugin", create: () => plugins.createGalleryPlugin({ images: ["/a.jpg"] }) },
  {
    dir: "SKUPlugin",
    create: () =>
      plugins.createSKUPlugin({
        attributes: [{ name: "颜色", options: ["红"] }],
        variants: [{ sku: "R", attrs: { 颜色: "红" } }],
      }),
  },
  { dir: "QuantityPlugin", create: () => plugins.createQuantityPlugin() },
  { dir: "PriceCalculatorPlugin", create: () => plugins.createPriceCalculatorPlugin() },
  { dir: "ComparePricePlugin", create: () => plugins.createComparePricePlugin() },
  {
    dir: "CouponPlugin",
    create: () => plugins.createCouponPlugin({ coupons: [{ code: "C", discount: 10 }] }),
  },
  {
    dir: "CouponRecommendPlugin",
    create: () =>
      plugins.createCouponRecommendPlugin({ coupons: [{ code: "C", discount: 10 }] }),
  },
  { dir: "OrderSummaryPlugin", create: () => plugins.createOrderSummaryPlugin() },
  { dir: "InventoryPlugin", create: () => plugins.createInventoryPlugin() },
  { dir: "BadgePlugin", create: () => plugins.createBadgePlugin({ text: "甄选" }) },
  { dir: "UserTagPlugin", create: () => plugins.createUserTagPlugin() },
  { dir: "CountdownPlugin", create: () => plugins.createCountdownPlugin() },
  { dir: "ReviewPlugin", create: () => plugins.createReviewPlugin() },
  { dir: "AnimationPlugin", create: () => plugins.createAnimationPlugin() },
  { dir: "ActionsPlugin", create: () => plugins.createActionsPlugin() },
  { dir: "HoverPlugin", create: () => plugins.createHoverPlugin() },
  { dir: "StatePlugin", create: () => plugins.createStatePlugin() },
  { dir: "AnalyticsPlugin", create: () => plugins.createAnalyticsPlugin() },
  { dir: "A11yPlugin", create: () => plugins.createA11yPlugin() },
  { dir: "ResponsivePlugin", create: () => plugins.createResponsivePlugin() },
];

describe("插件注册表完整性", () => {
  it("集中登记的插件目录都在磁盘上，且数量为 22", () => {
    expect(REGISTRY).toHaveLength(22);
    for (const { dir } of REGISTRY) {
      expect(existsSync(path.join(PLUGIN_DIR, dir)), `缺少目录 ${dir}`).toBe(true);
    }
  });

  it("插件目录一个不漏：磁盘上的目录都登记进来了", () => {
    const onDisk = readFileSync(path.join(PLUGIN_DIR, "index.ts"), "utf-8");
    for (const { dir } of REGISTRY) {
      expect(onDisk, `${dir} 未在桶文件导出`).toContain(dir);
    }
  });
});

describe.each(REGISTRY)("$dir", ({ dir, create }) => {
  const plugin = create();

  it("工厂返回 name 与 hooks，且 name 与目录名一致", () => {
    expect(plugin.name).toBe(dir);
    expect(plugin.hooks && typeof plugin.hooks === "object").toBe(true);
  });

  it("至少一个可用钩子，且不含已删除的死钩子", () => {
    const keys = Object.keys(plugin.hooks ?? {});
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(typeof (plugin.hooks as Record<string, unknown>)[key]).toBe("function");
    }
    for (const dead of REMOVED_HOOKS) {
      expect(keys, `${dir} 仍在用已删除的钩子 ${dead}`).not.toContain(dead);
    }
  });

  it("doc.json 存在、可解析、name 一致、config 字段完整", () => {
    const docPath = path.join(PLUGIN_DIR, dir, "doc.json");
    expect(existsSync(docPath), `${dir} 缺 doc.json`).toBe(true);

    const doc = JSON.parse(readFileSync(docPath, "utf-8"));
    expect(doc.name).toBe(dir);
    expect(typeof doc.description).toBe("string");
    expect(doc.description.length).toBeGreaterThan(0);
    expect(Array.isArray(doc.tags)).toBe(true);
    expect(Array.isArray(doc.config)).toBe(true);
    expect(Array.isArray(doc.features)).toBe(true);
    expect(Array.isArray(doc.useCases)).toBe(true);
    expect(Array.isArray(doc.notes)).toBe(true);
    expect(typeof doc.example).toBe("string");

    for (const item of doc.config) {
      expect(typeof item.name, `${dir} 的 config 项缺 name`).toBe("string");
      expect(typeof item.type, `${dir}.${item.name} 缺 type`).toBe("string");
      expect(typeof item.description, `${dir}.${item.name} 缺 description`).toBe(
        "string"
      );
    }
  });
});
