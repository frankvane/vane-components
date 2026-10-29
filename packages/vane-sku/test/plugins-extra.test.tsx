import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSkuSelector } from "../src";
import type { SkuAttribute, SkuVariant } from "../src";
import { createPriceRangePlugin } from "../src/custom-plugins/PriceRange";
import { createStockStatusPlugin } from "../src/custom-plugins/StockStatus";
import { createQuantityPlugin } from "../src/custom-plugins/Quantity";
import { createResetBarPlugin } from "../src/custom-plugins/ResetBar";
import { createKeyboardNavPlugin } from "../src/custom-plugins/KeyboardNav";
import { createAnalyticsPlugin } from "../src/custom-plugins/Analytics";
import { createUrlSyncPlugin } from "../src/custom-plugins/UrlSync";
import { createStatePersistencePlugin } from "../src/custom-plugins/StatePersistence";
import { createSkuCodePlugin } from "../src/custom-plugins/SkuCode";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const attributes: SkuAttribute[] = [
  { name: "颜色", options: [{ id: "red", label: "红" }, { id: "blue", label: "蓝" }] },
  { name: "尺码", options: [{ id: "s", label: "S" }, { id: "m", label: "M" }] },
];

const variants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 5, quota: 2 },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
];

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* 环境不支持存储时忽略 */
  }
});

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
const clickSel = async (sel: string) => {
  await act(async () => {
    (q(sel) as HTMLButtonElement).click();
  });
};

describe("PriceRangePlugin 价格区间", () => {
  const Sku = createSkuSelector([createPriceRangePlugin()]);

  it("未选全时展示价格区间（全部变体 199–229）", async () => {
    await mount(<Sku attributes={attributes} variants={variants} />);
    const el = q('[data-testid="sku-price-range"]');
    expect(el).toBeTruthy();
    expect(el!.textContent).toContain("199");
    expect(el!.textContent).toContain("229");
  });

  it("选了颜色后区间随选择收窄（红 = 199–219）", async () => {
    await mount(<Sku attributes={attributes} variants={variants} />);
    await clickSel('[data-testid="sku-opt-颜色-red"]');
    const text = q('[data-testid="sku-price-range"]')!.textContent ?? "";
    expect(text).toContain("199");
    expect(text).toContain("219");
    expect(text).not.toContain("229");
  });

  it("命中变体后默认退场（把价格区让给 PriceLink）", async () => {
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );
    expect(q('[data-testid="sku-price-range"]')).toBeNull();
  });
});

describe("StockStatusPlugin 库存状态", () => {
  it("库存充足显示现货", async () => {
    const Sku = createSkuSelector([createStockStatusPlugin()]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "blue", 尺码: "s" }} />
    );
    const el = q('[data-testid="sku-stock"]')!;
    expect(el.getAttribute("data-stock")).toBe("8");
    expect(el.textContent).toContain("现货");
  });

  it("库存 ≤ 阈值显示「仅剩 N 件」", async () => {
    const Sku = createSkuSelector([createStockStatusPlugin({ lowStockThreshold: 5 })]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );
    expect(q('[data-testid="sku-stock"]')!.textContent).toContain("仅剩 5 件");
  });

  it("库存 0 显示缺货", async () => {
    const Sku = createSkuSelector([createStockStatusPlugin()]);
    await mount(
      <Sku
        attributes={attributes}
        variants={[{ sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, stock: 0 }]}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    const el = q('[data-testid="sku-stock"]')!;
    expect(el.getAttribute("data-sold-out")).toBe("true");
    expect(el.textContent).toContain("暂时缺货");
  });
});

describe("QuantityPlugin 数量步进器", () => {
  it("上限取 库存与限购 的较小值（库存5/限购2 → 2）", async () => {
    const Sku = createSkuSelector([createQuantityPlugin()]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );
    expect(q('[data-testid="sku-quantity"]')!.getAttribute("data-max")).toBe("2");
  });

  it("点 + 递增、到上限后按钮禁用", async () => {
    const onChange = vi.fn();
    const Sku = createSkuSelector([createQuantityPlugin({ onChange })]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );
    expect(q('[data-testid="sku-quantity"]')!.getAttribute("data-quantity")).toBe("1");

    await clickSel('[data-testid="sku-quantity-plus"]');
    expect(q('[data-testid="sku-quantity"]')!.getAttribute("data-quantity")).toBe("2");
    expect(onChange).toHaveBeenCalledWith(2);

    expect((q('[data-testid="sku-quantity-plus"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it("点 − 递减，下限为 1", async () => {
    const Sku = createSkuSelector([createQuantityPlugin()]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );
    expect((q('[data-testid="sku-quantity-minus"]') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ResetBarPlugin 清空重选", () => {
  it("有选择时出现，点击后清空", async () => {
    const onReset = vi.fn();
    const Sku = createSkuSelector([createResetBarPlugin({ onReset })]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );
    expect(q('[data-testid="sku-reset"]')).toBeTruthy();

    await clickSel('[data-testid="sku-reset"]');
    expect(onReset).toHaveBeenCalled();
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe("false");
    expect(q('[data-testid="sku-reset"]')).toBeNull();
  });

  it("无选择时不渲染", async () => {
    const Sku = createSkuSelector([createResetBarPlugin()]);
    await mount(<Sku attributes={attributes} variants={variants} />);
    expect(q('[data-testid="sku-reset"]')).toBeNull();
  });
});

describe("KeyboardNavPlugin 键盘漫游", () => {
  it("→ 键切到同属性下一个选项", async () => {
    const Sku = createSkuSelector([createKeyboardNavPlugin()]);
    await mount(<Sku attributes={attributes} variants={variants} />);

    const red = q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement;
    await act(async () => {
      red.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });

    expect((q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).dataset.selected).toBe("true");
  });

  it("↓ 键跳到下一属性行", async () => {
    const Sku = createSkuSelector([createKeyboardNavPlugin()]);
    await mount(<Sku attributes={attributes} variants={variants} />);

    const red = q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement;
    await act(async () => {
      red.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });

    expect((q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).dataset.selected).toBe("true");
  });
});

describe("AnalyticsPlugin 埋点", () => {
  it("挂载与变更都上报；未命中标记为 sku:invalid", async () => {
    const onEvent = vi.fn();
    const Sku = createSkuSelector([createAnalyticsPlugin({ onEvent })]);
    await mount(<Sku attributes={attributes} variants={variants} />);

    expect(onEvent).toHaveBeenCalled();
    expect(onEvent.mock.calls[0][0].name).toBe("sku:mount");

    await clickSel('[data-testid="sku-opt-颜色-red"]');
    const names = onEvent.mock.calls.map((c) => c[0].name);
    expect(names).toContain("sku:invalid");

    await clickSel('[data-testid="sku-opt-尺码-s"]');
    expect(onEvent.mock.calls.map((c) => c[0].name)).toContain("sku:change");
  });

  it("onlyMatched 时未命中不上报", async () => {
    const onEvent = vi.fn();
    const Sku = createSkuSelector([createAnalyticsPlugin({ onEvent, onlyMatched: true })]);
    await mount(<Sku attributes={attributes} variants={variants} />);
    onEvent.mockClear();

    await clickSel('[data-testid="sku-opt-颜色-red"]');
    expect(onEvent).not.toHaveBeenCalled();
  });
});

describe("UrlSyncPlugin URL 同步", () => {
  it("选择写进查询串（sku_ 前缀）", async () => {
    const Sku = createSkuSelector([createUrlSyncPlugin()]);
    await mount(<Sku attributes={attributes} variants={variants} />);

    await clickSel('[data-testid="sku-opt-颜色-red"]');
    expect(decodeURIComponent(window.location.search)).toContain("sku_颜色=red");
  });
});

describe("StatePersistencePlugin 选择态持久化", () => {
  it("选择写入 localStorage，清空后删键", async () => {
    const Sku = createSkuSelector([createStatePersistencePlugin({ key: "t:sku" })]);
    await mount(<Sku attributes={attributes} variants={variants} />);

    await clickSel('[data-testid="sku-opt-颜色-red"]');
    expect(window.localStorage.getItem("t:sku")).toContain("red");

    await clickSel('[data-testid="sku-opt-颜色-red"]'); // 再点一次 = 取消
    expect(window.localStorage.getItem("t:sku")).toBeNull();
  });

  it("挂载时从存储还原选择", async () => {
    window.localStorage.setItem("t:sku2", JSON.stringify({ 颜色: "blue", 尺码: "s" }));
    const Sku = createSkuSelector([createStatePersistencePlugin({ key: "t:sku2" })]);
    await mount(<Sku attributes={attributes} variants={variants} />);

    expect((q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).dataset.selected).toBe("true");
    expect(q('[data-testid="sku-summary-variant"]')!.textContent).toContain("blue-s");
  });
});

describe("SkuCodePlugin 货号展示", () => {
  it("命中变体显示货号", async () => {
    const Sku = createSkuSelector([createSkuCodePlugin()]);
    await mount(
      <Sku attributes={attributes} variants={variants} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    );
    expect(q('[data-testid="sku-code"]')!.textContent).toContain("red-s");
  });

  it("未命中不渲染", async () => {
    const Sku = createSkuSelector([createSkuCodePlugin()]);
    await mount(<Sku attributes={attributes} variants={variants} />);
    expect(q('[data-testid="sku-code"]')).toBeNull();
  });
});
