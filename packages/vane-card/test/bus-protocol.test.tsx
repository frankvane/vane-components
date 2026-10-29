/**
 * C3.4 · 总线协议（R6）
 *
 * 总线键是插件之间唯一的契约：名字拼错不会报错，只会「静默不联动」。
 * 这里锁两层：
 *  1. 键值表冻结 —— 谁改了 BusKeys 的字符串，这里立刻红（文档/外部消费者都按这些值对接）；
 *  2. 端到端联动 —— SKU 选规格 → sku.price 变 → 价格区跟着变；
 *     数量变化 → 合计变。任何一环断了都会在这里暴露。
 */
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { BusKeys } from "../src/components/CardPlugin/plugins/BusKeys";
import {
  createSKUPlugin,
  createQuantityPlugin,
  createPriceCalculatorPlugin,
  createOrderSummaryPlugin,
} from "../src/custom-plugins";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import { renderCard, installObservers, flush } from "./helpers";

beforeEach(() => {
  installObservers();
});

const ATTRIBUTES = [{ name: "颜色", options: ["红", "蓝"] }];
const VARIANTS = [
  { sku: "R", attrs: { 颜色: "红" }, price: 299, stock: 8 },
  { sku: "B", attrs: { 颜色: "蓝" }, price: 319, stock: 2 },
];

/** 点掉某个按钮（happy-dom 下要靠 dispatchEvent + act，.click() 不一定进 React 的委托） */
async function clickText(container: HTMLElement, text: string) {
  const btn = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === text
  );
  if (!btn) throw new Error(`找不到按钮：${text}`);
  await act(async () => {
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await flush();
}

describe("BusKeys 键值表（外部对接契约）", () => {
  it("6 个键的字符串值被冻结：改名 = 破坏协议", () => {
    expect(BusKeys).toEqual({
      skuSelection: "sku.selection",
      skuVariant: "sku.variant",
      skuPrice: "sku.price",
      skuImage: "sku.image",
      quantity: "quantity",
      couponApplied: "coupon.applied",
    });
  });
});

describe("SKU → 价格 端到端联动", () => {
  const plugins = (): CardPlugin[] => [
    createSKUPlugin({ attributes: ATTRIBUTES, variants: VARIANTS }),
    createPriceCalculatorPlugin({ showTotalPrice: true }),
  ];

  it("首屏就用变体价，而不是 data.price（默认规格红 299）", async () => {
    const { container } = renderCard(plugins(), {
      data: { price: 100, defaultAttrs: { 颜色: "红" } },
    });
    await flush();
    const text = container.textContent ?? "";
    expect(text).toContain("299");
    expect(text).not.toContain("100");
  });

  it("切到蓝（319）后价格区跟着变", async () => {
    const { container } = renderCard(plugins(), {
      data: { price: 100, defaultAttrs: { 颜色: "红" } },
    });
    await flush();
    expect(container.textContent).toContain("299");

    await clickText(container, "蓝");
    expect(container.textContent).toContain("319");
    expect(container.textContent).not.toContain("299");
  });

  it("数量 +1 后合计翻倍（数量走总线 quantity）", async () => {
    const { container } = renderCard(
      [
        createSKUPlugin({ attributes: ATTRIBUTES, variants: VARIANTS }),
        createQuantityPlugin(),
        createPriceCalculatorPlugin({ showTotalPrice: true }),
      ],
      { data: { price: 100, defaultAttrs: { 颜色: "红" } } }
    );
    await flush();
    expect(container.textContent).toContain("299");

    // 步进器的「+」按钮
    await clickText(container, "+");
    const text = container.textContent ?? "";
    // 合计 299 * 2 = 598
    expect(text).toContain("598");
  });

  it("订单汇总与价格区口径一致（同一份总线数据）", async () => {
    const { container } = renderCard(
      [
        createSKUPlugin({ attributes: ATTRIBUTES, variants: VARIANTS }),
        createPriceCalculatorPlugin({ showTotalPrice: true }),
        createOrderSummaryPlugin({ showBreakdown: true }),
      ],
      { data: { price: 100, defaultAttrs: { 颜色: "红" } } }
    );
    await flush();
    // 299 在价格区与汇总区各出现一次（至少两次），且都不该出现 100
    const text = container.textContent ?? "";
    expect(text.split("299").length - 1).toBeGreaterThanOrEqual(2);
    expect(text).not.toContain("100");
  });
});

describe("原价字段契约（公开类型叫 oldPrice）", () => {
  const withOld = (extra: Record<string, unknown> = {}) =>
    renderCard([createPriceCalculatorPlugin({ showTotalPrice: false, ...extra })], {
      data: { price: 299, oldPrice: 399 },
    });

  it("data.oldPrice 能画出划线价、折扣与节省", async () => {
    // 插件早期只读 data.originalPrice，而 ProductData 里叫 oldPrice ——
    // 于是 showDiscount / showSavings 两个开关拖了半天什么都不变（原价恒为 0）。
    const { container } = await withOld();
    await flush();
    const text = container.textContent ?? "";
    expect(text).toContain("399"); // 划线原价
    expect(text).toContain("25%"); // (1 - 299/399) ≈ 25%
    expect(text).toContain("100"); // 省 100
  });

  it("旧字段 originalPrice 仍然兼容", async () => {
    const { container } = renderCard([createPriceCalculatorPlugin({})], {
      data: { price: 299, originalPrice: 399 },
    });
    await flush();
    expect(container.textContent).toContain("399");
  });

  it("两个开关真的各自生效", async () => {
    const off = await withOld({ showDiscount: false, showSavings: false, showSavingsBadgeInPriceArea: false });
    await flush();
    const t = off.container.textContent ?? "";
    expect(t).toContain("299");
    expect(t).not.toContain("25%");
    expect(t).not.toContain("已省");
  });
});
