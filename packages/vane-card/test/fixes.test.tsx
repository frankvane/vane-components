/**
 * 评审修复的回归测试（tasks/36 报告 P0-1 / P1-1..P1-5 / P2-1..P2-8）
 *
 * 每个用例都对准「修复前会失败」的行为，而不是只覆盖新代码路径：
 *  - P0-1：库存缺失被折算成 0 → 首帧盖售罄蒙层，且蒙层吞掉整卡点击
 *  - P1-1：pluginKey 只看插件名 → 同名插件换配置不生效
 *  - P1-2：半匹配变体被当成命中 → 只选颜色就套用「颜色+尺码」的价格
 *  - P1-3：切到无价变体后价格停在上一规格
 *  - P1-4：复合组件与插件各写各的状态 → 选了规格价格不动
 *  - P1-5：discount 一律当金额 → 8 折券只减 8 元
 *  - P2-1：transformData 从未被调用
 *  - P2-4：onMount / onUnmount 只认首次渲染的闭包
 *  - P2-5：同一批次连点两次，闭包 state 导致又回到「已加入」
 *  - P2-6：图片数量减少后 index 越界；javascript: 链接直接外跳
 *  - P2-7：加载失败后永久停在 failed，换新图也恢复不了
 *  - P2-8：输入防抖定时器在卸载后仍会写总线
 */
import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createActionsPlugin,
  createCouponPlugin,
  createGalleryPlugin,
  createImagePlugin,
  createInventoryPlugin,
  createPriceCalculatorPlugin,
  createQuantityPlugin,
  createSKUPlugin,
} from "../src/custom-plugins";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import { Price } from "../src/components/CardPlugin/compound/components/Price";
import { QuantityStepper } from "../src/components/CardPlugin/compound/components/QuantityStepper";
import { VariantSelector } from "../src/components/CardPlugin/compound/components/VariantSelector";
import { CouponBar } from "../src/components/CardPlugin/compound/components/CouponBar";
import { renderCard, renderCore, renderProductCard, installObservers, flush } from "./helpers";

beforeEach(() => {
  installObservers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function buttonByText(container: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => (b.textContent ?? "").trim() === text
  );
}

describe("CARD-P0-1 库存未知 ≠ 售罄，蒙层不吞点击", () => {
  it("data 没有 inventory 时不盖售罄蒙层", async () => {
    const { container } = renderCard([createInventoryPlugin()], { data: { price: 100 } });
    await flush();

    expect(container.textContent).not.toContain("已售罄");
    expect(container.querySelector('[data-card-sold-out="true"]')).toBeNull();
  });

  it("inventory=0 才判售罄，蒙层 pointer-events:none 且保留无障碍语义", async () => {
    const onClick = vi.fn();
    const { container } = renderCard([createInventoryPlugin()], {
      data: { price: 100, inventory: 0 },
      onClick,
    });
    await flush();

    const overlay = container.querySelector('[data-card-sold-out="true"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.pointerEvents).toBe("none");
    expect(overlay.getAttribute("role")).toBe("status");
    expect(overlay.getAttribute("aria-live")).toBe("polite");

    act(() => {
      (container.querySelector(".card-core") as HTMLElement).click();
    });
    expect(onClick).toHaveBeenCalled();
  });
});

describe("CARD-P1-1 同名插件换配置要生效", () => {
  const makeLabelPlugin = (label: string): CardPlugin => ({
    name: "LabelPlugin",
    version: "1.0.0",
    priority: 10,
    hooks: {
      renderFooter: () => React.createElement("span", { id: "label" }, label),
    },
    config: { label },
  });

  it("ProductCard 重渲染后使用新插件实例的配置", async () => {
    const { container, rerender } = renderProductCard({ plugins: [makeLabelPlugin("A")] });
    await flush();
    expect(container.querySelector("#label")?.textContent).toBe("A");

    await rerender({ plugins: [makeLabelPlugin("B")] });
    expect(container.querySelector("#label")?.textContent).toBe("B");
  });
});

describe("CARD-P1-2 规格必须完全匹配才套用变体价", () => {
  it("只选了颜色、没选尺码时不套用「颜色+尺码」的变体价；选全后才生效", async () => {
    const { container } = renderCard(
      [
        createSKUPlugin({
          attributes: [
            { name: "颜色", options: ["红"] },
            { name: "尺码", options: ["M"] },
          ],
          variants: [
            { sku: "R-M", attrs: { 颜色: "红", 尺码: "M" }, price: 499 },
          ],
        }),
        createPriceCalculatorPlugin(),
      ],
      { data: { price: 599, defaultAttrs: { 颜色: "红" } } }
    );
    await flush();

    expect(container.textContent).toContain("599");
    expect(container.textContent).not.toContain("499");

    act(() => {
      buttonByText(container, "M")!.click();
    });
    await flush();

    expect(container.textContent).toContain("499");
  });
});

describe("CARD-P1-3 切到无价变体要清掉派生价格", () => {
  it("红（有价）→ 蓝（无价）后价格回到 data.price", async () => {
    const { container } = renderCard(
      [
        createSKUPlugin({
          attributes: [{ name: "颜色", options: ["红", "蓝"] }],
          variants: [
            { sku: "R", attrs: { 颜色: "红" }, price: 499 },
            { sku: "B", attrs: { 颜色: "蓝" } },
          ],
        }),
        createPriceCalculatorPlugin(),
      ],
      { data: { price: 599, defaultAttrs: { 颜色: "红" } } }
    );
    await flush();
    expect(container.textContent).toContain("499");

    act(() => {
      buttonByText(container, "蓝")!.click();
    });
    await flush();

    expect(container.textContent).toContain("599");
    expect(container.textContent).not.toContain("499");
  });
});

describe("CARD-P1-4 复合组件与插件共用总线", () => {
  it("VariantSelector 选规格后，插件价格与复合 Price 同步", async () => {
    const { container } = renderProductCard({
      plugins: [createPriceCalculatorPlugin()],
      data: {
        price: 599,
        variants: [
          { id: "r", options: { 颜色: "红" }, price: 399 },
          { id: "b", options: { 颜色: "蓝" }, price: 299 },
        ],
      },
      children: React.createElement(
        React.Fragment,
        null,
        React.createElement(VariantSelector),
        React.createElement(Price)
      ),
    });
    await flush();
    expect(container.textContent).toContain("599");

    act(() => {
      buttonByText(container, "蓝")!.click();
    });
    await flush();

    expect(container.textContent).toContain("299");
    expect(container.textContent).not.toContain("599");
  });

  it("QuantityStepper 写入总线后，价格合计翻倍", async () => {
    const { container } = renderProductCard({
      plugins: [createPriceCalculatorPlugin({ showTotalPrice: true })],
      data: { price: 100 },
      children: React.createElement(QuantityStepper),
    });
    await flush();
    expect(container.textContent).toContain("合计 ¥100");

    act(() => {
      (container.querySelector('[aria-label="增加数量"]') as HTMLButtonElement).click();
    });
    await flush();

    expect(container.textContent).toContain("合计 ¥200");
  });
});

describe("CARD-P1-5 优惠券统一按 discountType 计算", () => {
  it("8 折券按小计打折（300 → 240），而不是只减 8 元", async () => {
    const { container } = renderCard(
      [
        createCouponPlugin({
          coupons: [{ code: "S20", discount: 8, discountType: "percentage" }],
        }),
        createPriceCalculatorPlugin({ showTotalPrice: true }),
      ],
      { data: { price: 300 } }
    );
    await flush();

    act(() => {
      buttonByText(container, "S20 - 8折")!.click();
    });
    await flush();

    expect(container.textContent).toContain("合计 ¥240");
  });

  it("CouponBar 用变体价×数量判断门槛，不满足门槛的券仍然展示", async () => {
    const { container } = renderProductCard({
      data: { price: 100 },
      children: React.createElement(CouponBar, {
        coupons: [
          { id: "c1", title: "满400减50", discount: 50, discountType: "amount", minAmount: 400 },
        ],
      }),
    });
    await flush();

    const coupon = container.querySelector(".vc-coupon");
    expect(coupon).not.toBeNull();
    // 旧版把不满足门槛的券直接过滤掉 → 这里根本不存在任何卡片
    expect(coupon?.classList.contains("is-unavailable")).toBe(true);
    expect(container.querySelector(".vc-coupon__discount")?.textContent).toBe("¥50");
  });
});

describe("CARD-P2-1 transformData 真正接入渲染链", () => {
  it("插件与 CardCore 都拿到变换后的数据", async () => {
    const doubling: CardPlugin = {
      name: "DoublingPlugin",
      version: "1.0.0",
      priority: 10,
      hooks: {
        transformData: (_context, data) => {
          const d = data as { price?: number };
          return {
            ...d,
            price: (d?.price ?? 0) * 2,
          };
        },
        renderFooter: (context) =>
          React.createElement(
            "span",
            { id: "plugin-data" },
            String((context.data as { price?: number } | undefined)?.price)
          ),
      },
      config: {},
    };

    const { container } = renderCard([doubling], {
      data: { price: 100 },
      renderContent: (data) =>
        React.createElement(
          "span",
          { id: "core-data" },
          String((data as { price?: number }).price)
        ),
    });
    await flush();

    expect(container.querySelector("#plugin-data")?.textContent).toBe("200");
    expect(container.querySelector("#core-data")?.textContent).toBe("200");
  });
});

describe("CARD-P2-4 CardCore 生命周期回调取最新闭包", () => {
  it("重渲染后卸载调用的是最新的 onUnmount", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { unmount, rerender } = renderCore({ onUnmount: first });

    await rerender({ onUnmount: second });
    unmount();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("CARD-P2-5 Actions 使用 sharedData 作为同步真源", () => {
  it("同一批次连点两次购物车，最终回到未加入", async () => {
    const { container } = renderCard([createActionsPlugin()], { data: {} });
    await flush();

    const add = buttonByText(container, "加入购物车")!;
    act(() => {
      add.click();
      add.click();
    });
    await flush();

    expect(buttonByText(container, "加入购物车")).not.toBeUndefined();
    expect(buttonByText(container, "移出购物车")).toBeUndefined();
  });
});

describe("CARD-P2-6 画廊越界与不安全外链", () => {
  it("图片从 2 张变 1 张后不越界，仍渲染首图", async () => {
    const { container, rerender } = renderCard([createGalleryPlugin()], {
      data: { images: ["/a.jpg", "/b.jpg"] },
    });
    await flush();

    act(() => {
      buttonByText(container, "›")!.click();
    });
    await flush();
    expect((container.querySelector("img") as HTMLImageElement).getAttribute("src")).toBe("/b.jpg");

    await rerender({ data: { images: ["/a.jpg"] } });
    expect((container.querySelector("img") as HTMLImageElement).getAttribute("src")).toBe("/a.jpg");
  });

  it("javascript: 协议的缩放链接不外跳", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const bad = renderCard([createGalleryPlugin({ images: ["javascript:alert(1)"], enableZoom: true })], {
      data: {},
    });
    await flush();
    act(() => {
      (bad.container.querySelector("img") as HTMLImageElement).click();
    });
    expect(openSpy).not.toHaveBeenCalled();

    const good = renderCard([createGalleryPlugin({ images: ["https://example.com/a.jpg"], enableZoom: true })], {
      data: {},
    });
    await flush();
    act(() => {
      (good.container.querySelector("img") as HTMLImageElement).click();
    });
    expect(openSpy).toHaveBeenCalled();
  });
});

describe("CARD-P2-7 图片失败后换新图可以恢复", () => {
  it("失败时保留 img 元素，换新 src 后可重新加载", async () => {
    const { container, rerender } = renderCard(
      [createImagePlugin({ errorFallback: React.createElement("span", { id: "fb" }, "图裂了") })],
      { data: { image: "/bad.jpg" } }
    );
    await flush();

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    act(() => {
      img.dispatchEvent(new Event("error"));
    });
    await flush();

    expect(container.querySelector("#fb")).not.toBeNull();
    expect(container.querySelector('[data-image-state="failed"]')).not.toBeNull();
    // 修复后不再整块替换掉 <img>，否则换图无法恢复
    expect(container.querySelector("img")).not.toBeNull();

    await rerender({ data: { image: "/ok.jpg" } });
    const next = container.querySelector("img") as HTMLImageElement;
    await act(async () => {
      next.dispatchEvent(new Event("load"));
    });
    await flush();

    expect(container.querySelector("#fb")).toBeNull();
    expect(container.querySelector('[data-image-state="loaded"]')).not.toBeNull();
  });
});

describe("CARD-P2-8 QuantityPlugin 卸载清理输入防抖", () => {
  it("卸载时清掉未触发的定时器", async () => {
    const setSpy = vi.spyOn(window, "setTimeout");
    const clearSpy = vi.spyOn(window, "clearTimeout");

    const { container, unmount } = renderCard([createQuantityPlugin()]);
    await flush();

    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, "5");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const timerId = setSpy.mock.results[setSpy.mock.results.length - 1]?.value;
    unmount();
    await flush();

    expect(clearSpy.mock.calls.some(([id]) => id === timerId)).toBe(true);
  });
});
