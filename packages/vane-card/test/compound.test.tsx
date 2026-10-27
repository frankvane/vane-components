/**
 * 复合组件冒烟（C4.1/C4.2）
 *
 * 两件事：
 *  1. 38 个复合组件在真实 `<ProductCard>` 上下文里逐个渲染 —— 旧 demo 一直
 *     测的是 npm 1.0.8，这批代码在新内核下从未一起跑过。
 *  2. 价格区接缝（D3-A）：装 3 个 renderPriceArea 插件，`<ProductCard.Price>`
 *     要把 3 段都渲染出来且顺序正确（R5）。
 */
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { ProductCard } from "../src/components/CardPlugin/compound";
import { matchVariant } from "../src/components/CardPlugin/types/product";
import type { ProductData } from "../src/components/CardPlugin/types/product";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import { installObservers, flush, renderProductCard } from "./helpers";

beforeEach(() => {
  installObservers();
  document.body.innerHTML = "";
});

/** 覆盖绝大多数组件读取字段的商品数据 */
const DATA: ProductData = {
  title: "经典圆领T恤",
  subtitle: "新疆长绒棉",
  description: "亲肤透气，适合夏天",
  image: "/img/main.jpg",
  images: ["/img/main.jpg", "/img/side.jpg"],
  price: 299,
  oldPrice: 399,
  inventory: 12,
  sku: "TS-BASE",
  brand: "VANE",
  badge: "新品",
  badges: ["新品", "包邮"],
  tags: ["纯棉", "夏季"],
  features: ["不掉色", "不起球"],
  specs: [{ key: "材质", value: "100% 棉" }],
  colors: [{ name: "红", hex: "#d0021b" }],
  sizes: ["M", "L"],
  variants: [
    { id: "v-red-m", sku: "TS-RED-M", price: 319, stock: 3, options: { color: "红", size: "M" } },
  ],
  rating: 4.6,
  ratingCount: 120,
  shipping: "顺丰包邮",
  warranty: "一年质保",
  weightGram: 500,
  unitWeight: 0.5,
};

type Case = {
  name: string;
  node: React.ReactElement;
  /** 期望渲染出的文本（缺省只断言"有内容"） */
  text?: string;
  /** 期望渲染出的标签名（HTML 元素结构断言） */
  tag?: string;
};

const CASES: Case[] = [
  { name: "Image", node: <ProductCard.Image />, tag: "IMG" },
  { name: "Badge", node: <ProductCard.Badge />, text: "新品" },
  { name: "BadgeGroup", node: <ProductCard.BadgeGroup />, text: "包邮" },
  { name: "Brand", node: <ProductCard.Brand />, text: "VANE" },
  { name: "Title", node: <ProductCard.Title />, text: "经典圆领T恤" },
  { name: "Subtitle", node: <ProductCard.Subtitle />, text: "新疆长绒棉" },
  { name: "Description", node: <ProductCard.Description lines={1} />, text: "亲肤透气" },
  { name: "Price", node: <ProductCard.Price />, text: "299" },
  { name: "OldPrice", node: <ProductCard.OldPrice />, text: "399" },
  { name: "Discount", node: <ProductCard.Discount />, text: "-25%" },
  { name: "SavingsBadge", node: <ProductCard.SavingsBadge />, text: "省¥100.00" },
  { name: "PricePerUnit", node: <ProductCard.PricePerUnit />, text: "每100g约 ¥59.80" },
  { name: "Tags", node: <ProductCard.Tags />, text: "纯棉" },
  { name: "FeatureList", node: <ProductCard.FeatureList />, text: "不起球" },
  { name: "SpecsTable", node: <ProductCard.SpecsTable />, text: "100% 棉" },
  { name: "Rating", node: <ProductCard.Rating />, text: "4.6" },
  { name: "Inventory", node: <ProductCard.Inventory />, text: "库存充足" },
  { name: "StockBadge", node: <ProductCard.StockBadge />, text: "现货" },
  { name: "SKUCode", node: <ProductCard.SKUCode />, text: "TS-BASE" },
  { name: "Shipping", node: <ProductCard.Shipping />, text: "顺丰包邮" },
  { name: "Warranty", node: <ProductCard.Warranty />, text: "一年质保" },
  { name: "Divider", node: <ProductCard.Divider />, tag: "DIV" },
  { name: "Section", node: <ProductCard.Section title="配件">内容</ProductCard.Section>, text: "配件" },
  { name: "Actions", node: <ProductCard.Actions />, text: "加入购物车" },
  { name: "QuantityStepper", node: <ProductCard.QuantityStepper />, tag: "INPUT" },
  { name: "ColorSwatches", node: <ProductCard.ColorSwatches />, tag: "BUTTON" },
  { name: "SizeSelector", node: <ProductCard.SizeSelector />, text: "M" },
  { name: "OptionPicker", node: <ProductCard.OptionPicker name="color" options={["红", "蓝"]} />, text: "蓝" },
  { name: "VariantSelector", node: <ProductCard.VariantSelector />, text: "size" },
  { name: "SelectedInfo", node: <ProductCard.SelectedInfo />, text: "选中信息" },
  { name: "OrderSummaryPanel", node: <ProductCard.OrderSummaryPanel />, text: "订单明细" },
  {
    name: "CouponBar",
    node: (
      <ProductCard.CouponBar
        coupons={[{ id: "c1", title: "满减券", discount: 20, discountType: "amount" }]}
      />
    ),
    text: "满减券",
  },
  {
    name: "UpsellBundle",
    node: (
      <ProductCard.UpsellBundle
        bundles={[
          { id: "b1", title: "套装", items: [{ id: "i1", title: "袜子", price: 1900 }], bundlePrice: 1500 },
        ]}
      />
    ),
    text: "套装",
  },
  { name: "VariantMediaSwitcher", node: <ProductCard.VariantMediaSwitcher />, tag: "IMG" },
  {
    name: "ShippingEstimator",
    node: (
      <ProductCard.ShippingEstimator
        regions={[{ code: "sh", name: "上海", baseFee: 8, etaDays: 2 }]}
        methods={[{ code: "std", name: "标准快递" }]}
      />
    ),
    text: "预计运费",
  },
  { name: "DeliveryTimeline", node: <ProductCard.DeliveryTimeline etaDays={5} />, text: "预计" },
  { name: "ReturnPolicy", node: <ProductCard.ReturnPolicy />, text: "退换政策" },
  { name: "A11yToolbar", node: <ProductCard.A11yToolbar />, text: "大字号" },
];

describe("复合组件冒烟（38 个）", () => {
  it.each(CASES.map((c) => [c.name, c] as const))("%s 渲染出内容", (_name, testCase) => {
    const { container, unmount } = renderProductCard({ data: DATA, children: testCase.node });
    const html = container.innerHTML;
    expect(html.length).toBeGreaterThan(0);
    if (testCase.text) expect(container.textContent).toContain(testCase.text);
    if (testCase.tag) expect(container.querySelector(testCase.tag.toLowerCase())).not.toBeNull();
    unmount();
  });

  it("38 个组件全部挂得上点号（防止漏挂）", () => {
    const names = [
      "Image", "Badge", "Title", "Price", "Description", "Actions", "Section", "Rating",
      "Inventory", "Subtitle", "OldPrice", "Discount", "Tags", "Brand", "Shipping", "Warranty",
      "Divider", "FeatureList", "SpecsTable", "SKUCode", "BadgeGroup", "PricePerUnit",
      "QuantityStepper", "OptionPicker", "ColorSwatches", "SizeSelector", "VariantSelector",
      "SelectedInfo", "OrderSummaryPanel", "SavingsBadge", "CouponBar", "StockBadge",
      "VariantMediaSwitcher", "ShippingEstimator", "DeliveryTimeline", "ReturnPolicy",
      "UpsellBundle", "A11yToolbar",
    ];
    expect(names).toHaveLength(38);
    for (const name of names) {
      expect(typeof (ProductCard as unknown as Record<string, unknown>)[name]).not.toBe("undefined");
    }
  });

  it("没有 data 也不炸（全字段可缺）", () => {
    const { container, unmount } = renderProductCard({
      data: {},
      children: <ProductCard.Title />,
    });
    expect(container.querySelector(".vc-product-card")).not.toBeNull();
    unmount();
  });
});

describe("价格区接缝（D3-A / R5）", () => {
  const pricePlugin = (name: string, text: string, order: number): CardPlugin => ({
    name,
    config: { order },
    hooks: {
      renderPriceArea: () => <span data-testid={name}>{text}</span>,
    },
  });

  it("3 个价格插件按 config.order 升序渲染进 Price", () => {
    const plugins = [
      pricePlugin("third", "C", 30),
      pricePlugin("first", "A", 10),
      pricePlugin("second", "B", 20),
    ];
    const { container, unmount } = renderProductCard({
      data: DATA,
      plugins,
      children: <ProductCard.Price />,
    });
    const slot = container.querySelector('[data-slot="price-area"]');
    expect(slot).not.toBeNull();
    const order = Array.from(slot!.querySelectorAll("[data-testid]")).map((el) =>
      el.getAttribute("data-testid")
    );
    expect(order).toEqual(["first", "second", "third"]);
    unmount();
  });

  it("没有插件时不渲染空槽", () => {
    const { container, unmount } = renderProductCard({
      data: DATA,
      children: <ProductCard.Price />,
    });
    expect(container.querySelector('[data-slot="price-area"]')).toBeNull();
    unmount();
  });
});

describe("变体匹配口径", () => {
  it("只选了一部分属性时不认半匹配变体（避免显示错价）", () => {
    expect(matchVariant(DATA.variants as never, { color: "红" })).toBeUndefined();
  });

  it("属性全匹配才返回该变体", () => {
    const hit = matchVariant(DATA.variants as never, { color: "红", size: "M" });
    expect(hit?.sku).toBe("TS-RED-M");
  });

  it("未选属性返回 undefined", () => {
    expect(matchVariant(DATA.variants as never, {})).toBeUndefined();
    expect(matchVariant(undefined, { color: "红" })).toBeUndefined();
  });
});

describe("ProductCard 稳定性", () => {
  it("内联 plugins 数组不会导致卡片重挂（onMount 只跑一次）", async () => {
    let mounts = 0;
    const makePlugins = (): CardPlugin[] => [
      {
        name: "counter",
        hooks: {
          onMount: () => {
            mounts += 1;
          },
        },
      },
    ];

    const { rerender, unmount } = renderProductCard({
      data: DATA,
      plugins: makePlugins(),
      children: <ProductCard.Title />,
    });
    await flush();
    expect(mounts).toBe(1);

    // 每次都是新数组、内容相同：不应重建 Core
    await rerender({ plugins: makePlugins() });
    await rerender({ plugins: makePlugins() });
    expect(mounts).toBe(1);
    unmount();
  });
});
