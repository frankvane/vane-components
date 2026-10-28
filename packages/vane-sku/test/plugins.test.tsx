import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSkuSelector } from "../src";
import type { SkuAttribute, SkuVariant } from "../src";
import { createPriceLinkPlugin } from "../src/custom-plugins/PriceLink";
import { createQuotaPlugin } from "../src/custom-plugins/Quota";
import { createImageLinkPlugin } from "../src/custom-plugins/ImageLink";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const attributes: SkuAttribute[] = [
  { name: "颜色", options: [{ id: "red", label: "红" }, { id: "blue", label: "蓝" }] },
  { name: "尺码", options: [{ id: "s", label: "S" }, { id: "m", label: "M" }] },
];

const variants: SkuVariant[] = [
  {
    sku: "red-s",
    attrValues: { 颜色: "red", 尺码: "s" },
    price: 199,
    originalPrice: 299,
    stock: 5,
    quota: 2,
    image: "https://example.com/red.jpg",
  },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8, quota: 2 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
];

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = null;
  root = null;
});

async function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(ui);
  });
  return container;
}

const q = (sel: string) => container!.querySelector(sel);

describe("PriceLinkPlugin 价格联动", () => {
  const Sku = createSkuSelector([createPriceLinkPlugin({ discountText: "限时8折" })]);

  it("命中变体时渲染价格 / 原价删除线 / 折扣文案", async () => {
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );

    const price = q('[data-testid="sku-price"]');
    expect(price).toBeTruthy();
    expect(price!.textContent).toContain("199");
    expect(q('[data-testid="sku-price-original"]')!.textContent).toContain("299");
    expect(q('[data-testid="sku-price-discount"]')!.textContent).toContain("限时8折");
  });

  it("未选全时不渲染价格区", async () => {
    await mount(<Sku attributes={attributes} variants={variants} />);
    expect(q('[data-testid="sku-price"]')).toBeNull();
  });
});

describe("QuotaPlugin 限购校验", () => {
  it("未超限：提示限购件数且 canPurchase=true", async () => {
    const Sku = createSkuSelector([createQuotaPlugin({ purchasedCount: 1 })]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );

    const quota = q('[data-testid="sku-quota"]');
    expect(quota).toBeTruthy();
    expect(quota!.textContent).toContain("每人限购 2 件");
    expect(quota!.getAttribute("data-can-purchase")).toBe("true");
  });

  it("已超限：canPurchase=false 并触发 onExceed", async () => {
    const onExceed = vi.fn();
    const Sku = createSkuSelector([createQuotaPlugin({ purchasedCount: 2, onExceed })]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );

    // 挂载时 onMount 写入 canPurchase=false（未超限不触发 onExceed）
    expect(q('[data-testid="sku-quota"]')!.getAttribute("data-can-purchase")).toBe("false");

    // 切到另一个同样限购的变体（blue-s，quota 2 / 已购 2）→ onSkuChange → onExceed
    await act(async () => {
      (q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).click();
    });
    expect(onExceed).toHaveBeenCalled();
  });

  it("未声明 quota 的变体不渲染限购条（视为不限购）", async () => {
    const Sku = createSkuSelector([createQuotaPlugin({ purchasedCount: 1 })]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "m" }} />
    );
    expect(q('[data-testid="sku-quota"]')).toBeNull();
  });
});

describe("ImageLinkPlugin 规格切主图", () => {
  it("命中带图变体时回调 onImageChange", async () => {
    const onImageChange = vi.fn();
    const Sku = createSkuSelector([createImageLinkPlugin({ onImageChange })]);

    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );

    expect(onImageChange).toHaveBeenCalledWith("https://example.com/red.jpg");
  });

  it("变体无图时不回调（只发事件，自身不渲染 UI）", async () => {
    const onImageChange = vi.fn();
    const Sku = createSkuSelector([createImageLinkPlugin({ onImageChange })]);

    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "m" }} />
    );

    expect(onImageChange).not.toHaveBeenCalled();
    // ImageLink 不占用任何渲染插槽
    expect(q('[data-testid="sku-price"]')).toBeNull();
  });
});
