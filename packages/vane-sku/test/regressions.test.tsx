import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSkuSelector, withPlugins } from "../src";
import type {
  SkuAttribute,
  SkuPlugin,
  SkuPluginContext,
  SkuSelectorCoreProps,
  SkuSelectorCoreRef,
  SkuVariant,
} from "../src";
import {
  isPurchasable,
  remainingQuota,
  quantityUpper,
  normalizeSkuData,
  normalizeSelection,
} from "../src";
import { createQuantityPlugin } from "../src/custom-plugins/QuantityPlugin";
import { createQuotaPlugin } from "../src/custom-plugins/QuotaPlugin";
import { createPriceLinkPlugin } from "../src/custom-plugins/PriceLinkPlugin";
import { createPriceRangePlugin } from "../src/custom-plugins/PriceRangePlugin";
import { createKeyboardNavPlugin } from "../src/custom-plugins/KeyboardNavPlugin";
import { createUrlSyncPlugin } from "../src/custom-plugins/UrlSyncPlugin";
import { createStatePersistencePlugin } from "../src/custom-plugins/StatePersistencePlugin";

/**
 * 评审报告 43 的回归测试（T01–T07）。
 * 每条用例对应一个已修复的缺陷编号（SKU-P0-x / SKU-P1-x / SKU-P2-x）。
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const attributes: SkuAttribute[] = [
  { name: "颜色", options: [{ id: "red", label: "红" }, { id: "blue", label: "蓝" }] },
  {
    name: "尺码",
    options: [
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
  },
];

const variants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 5 },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
];

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
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

async function rerender(ui: React.ReactElement) {
  await act(async () => {
    root!.render(ui);
  });
}

const q = (sel: string) => container!.querySelector(sel);
const qa = (sel: string) => Array.from(container!.querySelectorAll(sel));

/** 探针插件：把内核 state 里的 quantity 渲染出来，用于断言「数量真的写回了 state」 */
const probePlugin: SkuPlugin = {
  name: "Probe",
  version: "0.1.0",
  description: "test probe",
  priority: 1,
  hooks: {
    renderFooter: (context: SkuPluginContext) => (
      <span data-testid="probe-quantity">
        {typeof context.state?.quantity === "number"
          ? String(context.state.quantity)
          : "none"}
      </span>
    ),
  },
};

const SkuBare = createSkuSelector([]);

// ---------------------------------------------------------------- P0-1 / P2-1

const SkuDirtyDefault = createSkuSelector([]);

describe("SKU-P0-1 非法 / 陈旧 selection 不再全灰死锁", () => {
  it("脏 defaultSelection（optionId 不存在）被丢弃，矩阵仍可点", async () => {
    await mount(
      <SkuDirtyDefault
        attributes={attributes}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "xl", 未知属性: "oops" }}
      />
    );

    // 尺码行的候选没有被脏值拖死
    expect((q('[data-testid="sku-opt-尺码-m"]') as HTMLButtonElement).disabled).toBe(false);
    expect((q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).disabled).toBe(false);
    // 合法部分保留，脏值不进入选中态
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );
    expect((q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).dataset.selected).toBe(
      "false"
    );
    // 至少存在可点选项（死锁的直接判据）
    const clickable = qa('[data-testid^="sku-opt-"]').filter(
      (el) => !(el as HTMLButtonElement).disabled
    );
    expect(clickable.length).toBeGreaterThan(0);
  });

  it("localStorage 里的陈旧选择（换了商品）也不会写进 state", async () => {
    window.localStorage.setItem(
      "dirty:sku",
      JSON.stringify({ 颜色: "red", 尺码: "xl" })
    );
    const Sku = createSkuSelector([createStatePersistencePlugin({ key: "dirty:sku" })]);
    await mount(<Sku attributes={attributes} variants={variants} />);

    expect((q('[data-testid="sku-opt-尺码-m"]') as HTMLButtonElement).disabled).toBe(false);
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );
  });

  it("normalizeSelection 纯函数：只保留合法键值", () => {
    expect(
      normalizeSelection(attributes, { 颜色: "red", 尺码: "xl", 未知: "x" })
    ).toEqual({ 颜色: "red" });
    expect(normalizeSelection(attributes, null)).toEqual({});
  });
});

describe("SKU-P2-1 已选项即使在禁用集中也允许取消", () => {
  it("库存变为 0 后，已选中的选项仍可点击取消", async () => {
    const Sku = createSkuSelector([]);
    await mount(
      <Sku
        attributes={attributes}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    expect((q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).disabled).toBe(false);

    // 库存轮询把 red-s 变成 0：该选项会被禁用推导置灰，但它仍是「已选中」
    await rerender(
      <Sku
        attributes={attributes}
        variants={variants.map((v) =>
          v.sku === "red-s" ? { ...v, stock: 0 } : v
        )}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );

    const selectedM = q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement;
    expect(selectedM.dataset.selected).toBe("true");
    expect(selectedM.dataset.disabled).toBe("true");
    // 关键：没有 disabled，用户才能点回去
    expect(selectedM.disabled).toBe(false);

    await act(async () => {
      selectedM.click();
    });
    expect((q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).dataset.selected).toBe(
      "false"
    );
  });
});

// ---------------------------------------------------------------- P0-2

describe("SKU-P0-2 数量必须写回内核 state 并随库存收敛", () => {
  it("库存从 10 降到 2 时 state.quantity 收敛为 2 并触发 onChange", async () => {
    const onChange = vi.fn();
    const SkuQuantity = createSkuSelector([
      createQuantityPlugin({ onChange }),
      probePlugin,
    ]);

    const stock10: SkuVariant[] = [
      { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 10 },
    ];
    const stock2 = stock10.map((v) => ({ ...v, stock: 2 }));

    await mount(
      <SkuQuantity
        attributes={attributes}
        variants={stock10}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    expect(q('[data-testid="probe-quantity"]')!.textContent).toBe("1");

    // 用户加到 5 件（上限 10）
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        (q('[data-testid="sku-quantity-plus"]') as HTMLButtonElement).click();
      });
    }
    expect(q('[data-testid="sku-quantity"]')!.getAttribute("data-quantity")).toBe("5");
    expect(q('[data-testid="probe-quantity"]')!.textContent).toBe("5");

    // 库存被轮询改小：UI、state 与回调都必须收敛到 2
    await rerender(
      <SkuQuantity
        attributes={attributes}
        variants={stock2}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    expect(q('[data-testid="sku-quantity"]')!.getAttribute("data-quantity")).toBe("2");
    expect(q('[data-testid="probe-quantity"]')!.textContent).toBe("2");
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("变体消失（未选全 / 无可售组合）时数量回到 1", async () => {
    const onChange = vi.fn();
    const SkuQuantity = createSkuSelector([
      createQuantityPlugin({ onChange }),
      probePlugin,
    ]);

    const stock10: SkuVariant[] = [
      { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 10 },
    ];
    await mount(
      <SkuQuantity
        attributes={attributes}
        variants={stock10}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    await act(async () => {
      (q('[data-testid="sku-quantity-plus"]') as HTMLButtonElement).click();
    });
    expect(q('[data-testid="probe-quantity"]')!.textContent).toBe("2");

    await rerender(
      <SkuQuantity
        attributes={attributes}
        variants={[]}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    expect(q('[data-testid="probe-quantity"]')!.textContent).toBe("1");
    expect(onChange).toHaveBeenLastCalledWith(1);
  });
});

// ---------------------------------------------------------------- P0-3

describe("SKU-P0-3 数据形状缺失不再白屏", () => {
  it("属性缺 options / 变体缺 attrValues 时不抛异常、正常渲染", async () => {
    const brokenAttributes = [{ name: "颜色" } as unknown as SkuAttribute];
    const brokenVariants = [{ sku: "x" } as unknown as SkuVariant];

    await mount(
      <SkuBare attributes={brokenAttributes} variants={brokenVariants} />
    );

    expect(q('[data-testid="sku-attr-颜色"]')).toBeTruthy();
    expect(q('[data-testid="sku-error"]')).toBeNull();
    // 缺 options → 该属性无候选按钮
    expect(qa('[data-testid^="sku-opt-颜色-"]').length).toBe(0);
  });

  it("attributes 传 null 也不崩", async () => {
    await mount(
      <SkuBare
        attributes={null as unknown as SkuAttribute[]}
        variants={null as unknown as SkuVariant[]}
      />
    );
    expect(q('[data-testid="sku-groups"]')).toBeTruthy();
    expect(q('[data-testid="sku-error"]')).toBeNull();
  });

  it("HOC 级错误边界兜底：Core 渲染异常时降级而非整页白屏", async () => {
    const Boom = withPlugins(
      React.forwardRef<SkuSelectorCoreRef, SkuSelectorCoreProps>(() => {
        throw new Error("boom");
      }),
      []
    );
    await mount(<Boom attributes={attributes} variants={variants} />);
    expect(q('[data-testid="sku-error"]')).toBeTruthy();
  });

  it("normalizeSkuData 纯函数：补齐缺失字段并去重", () => {
    const result = normalizeSkuData(
      [{ name: "颜色" }, { name: "颜色" }] as unknown as SkuAttribute[],
      [{ sku: "a" }, { sku: "a" }] as unknown as SkuVariant[]
    );
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].options).toEqual([]);
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].attrValues).toEqual({});
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------- P1-1

describe("SKU-P1-1 可售判定统一，缺货变体不触发 onValidSkuChange", () => {
  it("命中但 stock=0 的变体：回调不触发，摘要标注缺货", async () => {
    const Sku = createSkuSelector([]);
    const onValid = vi.fn();
    const soldOut: SkuVariant[] = [
      { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 0 },
    ];
    await mount(
      <Sku
        attributes={attributes}
        variants={soldOut}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onValidSkuChange={onValid}
      />
    );
    expect(onValid).not.toHaveBeenCalled();
    expect(q('[data-testid="sku-summary-variant"]')!.textContent).toContain("缺货");
  });

  it("库存在运行中变为 0 时不再宣告「有效 SKU」", async () => {
    const Sku = createSkuSelector([]);
    const onValid = vi.fn();
    await mount(
      <Sku
        attributes={attributes}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onValidSkuChange={onValid}
      />
    );
    await act(async () => {
      (q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).click();
      (q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).click();
    });
    // 重新选中 red-s（库存 5）→ 可售回调
    await act(async () => {
      (q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).click();
    });
    expect(onValid).toHaveBeenCalledTimes(1);

    await rerender(
      <Sku
        attributes={attributes}
        variants={variants.map((v) => (v.sku === "red-s" ? { ...v, stock: 0 } : v))}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onValidSkuChange={onValid}
      />
    );
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(q('[data-testid="sku-summary-variant"]')!.textContent).toContain("缺货");
  });

  it("ignoreOutOfStock=false 时缺货变体仍视为可售（口径一致）", () => {
    expect(isPurchasable({ sku: "x", attrValues: {}, stock: 0 })).toBe(false);
    expect(
      isPurchasable({ sku: "x", attrValues: {}, stock: 0 }, { ignoreOutOfStock: false })
    ).toBe(true);
  });
});

// ---------------------------------------------------------------- P1-2

describe("SKU-P1-2 受控 selection", () => {
  const Sku = createSkuSelector([]);

  it("传入 selection 即以 props 为准，父级更新后选中态同步", async () => {
    await mount(
      <Sku
        attributes={attributes}
        variants={variants}
        selection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );
    expect(q('[data-testid="sku-summary-variant"]')!.textContent).toContain("red-s");

    await rerender(
      <Sku
        attributes={attributes}
        variants={variants}
        selection={{ 颜色: "blue", 尺码: "s" }}
      />
    );
    expect((q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "false"
    );
    expect(q('[data-testid="sku-summary-variant"]')!.textContent).toContain("blue-s");
  });

  it("点击通过 onSelectionChange 回传，而不是只改内部 state", async () => {
    const onSelectionChange = vi.fn();
    await mount(
      <Sku
        attributes={attributes}
        variants={variants}
        selection={{ 颜色: "blue", 尺码: "s" }}
        onSelectionChange={onSelectionChange}
      />
    );
    await act(async () => {
      (q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).click();
    });
    expect(onSelectionChange).toHaveBeenCalledWith({ 颜色: "red", 尺码: "s" }, expect.anything());
  });
});

// ---------------------------------------------------------------- P1-3

describe("SKU-P1-3 限购扣减已购件数", () => {
  const withQuota: SkuVariant[] = [
    { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 5, quota: 2 },
  ];

  it("已购 1 / 限购 2 → 数量上限 1、剩余 1", async () => {
    const Sku = createSkuSelector([
      createQuantityPlugin({ purchasedCount: 1 }),
      createQuotaPlugin({ purchasedCount: 1 }),
    ]);
    await mount(
      <Sku
        attributes={attributes}
        variants={withQuota}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );

    expect(q('[data-testid="sku-quantity"]')!.getAttribute("data-max")).toBe("1");
    expect(q('[data-testid="sku-quota"]')!.getAttribute("data-can-purchase")).toBe("true");
    expect(q('[data-testid="sku-quota"]')!.getAttribute("data-remaining")).toBe("1");
    // state 里的数量同样不应超过剩余额度
    expect((q('[data-testid="sku-quantity-plus"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it("remainingQuota / quantityUpper 纯函数口径", () => {
    expect(remainingQuota(2, 1)).toBe(1);
    expect(remainingQuota(2, 2)).toBe(0);
    expect(remainingQuota(2, 5)).toBe(0);
    expect(remainingQuota(undefined, 3)).toBe(Infinity);
    expect(
      quantityUpper(
        { sku: "x", attrValues: {}, stock: 5, quota: 2 },
        { purchasedCount: 1 }
      )
    ).toBe(1);
  });
});

// ---------------------------------------------------------------- P2-2

describe("SKU-P2-2 价格区间排除缺货并固定两位小数", () => {
  const priceVariants: SkuVariant[] = [
    { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 0 },
    { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219.5, stock: 3 },
    { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
    { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229.6, stock: 6 },
  ];

  it("区间不包含缺货变体的价格，且保留两位小数", async () => {
    const Sku = createSkuSelector([createPriceRangePlugin()]);
    await mount(<Sku attributes={attributes} variants={priceVariants} />);

    const text = q('[data-testid="sku-price-range"]')!.textContent ?? "";
    expect(text).toContain("209.00");
    expect(text).toContain("229.60");
    expect(text).not.toContain("199");
  });

  it("单价与摘要价格都固定两位小数", async () => {
    const Sku = createSkuSelector([createPriceLinkPlugin()]);
    await mount(
      <Sku
        attributes={attributes}
        variants={priceVariants}
        defaultSelection={{ 颜色: "red", 尺码: "m" }}
      />
    );
    expect(q('[data-testid="sku-price"]')!.textContent).toContain("219.50");
    expect(q('[data-testid="sku-summary-variant"]')!.textContent).toContain("219.50");
  });
});

// ---------------------------------------------------------------- P2-3

describe("SKU-P2-3 重复属性名 / 重复 optionId 被去重", () => {
  it("同名属性只渲染一行，重复 optionId 只保留一个按钮", async () => {
    const duplicated: SkuAttribute[] = [
      {
        name: "颜色",
        options: [
          { id: "red", label: "红" },
          { id: "red", label: "红（重复）" },
          { id: "blue", label: "蓝" },
        ],
      },
      { name: "颜色", options: [{ id: "red", label: "红2" }] },
      { name: "尺码", options: [{ id: "s", label: "S" }] },
    ];

    const Sku = createSkuSelector([]);
    await mount(<Sku attributes={duplicated} variants={variants} />);

    expect(qa('[data-testid="sku-attr-颜色"]').length).toBe(1);
    expect(qa('[data-testid="sku-opt-颜色-red"]').length).toBe(1);
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).textContent).toBe("红");
  });
});

// ---------------------------------------------------------------- P2-4

describe("SKU-P2-4 派生计算与插槽缓存", () => {
  it("同一 props 引用重渲染不会重复执行插件渲染钩子", async () => {
    let renders = 0;
    const counting: SkuPlugin = {
      name: "CountingProbe",
      version: "0.1.0",
      description: "count renderHeader calls",
      priority: 1,
      hooks: {
        renderFooter: () => {
          renders += 1;
          return <span data-testid="counting-probe">{renders}</span>;
        },
      },
    };
    const Sku = createSkuSelector([counting]);
    const element = <Sku attributes={attributes} variants={variants} />;

    await mount(element);
    const afterMount = renders;

    // 同一个元素对象 → props 引用不变 → context 与插槽命中缓存
    await act(async () => {
      root!.render(element);
    });
    expect(renders).toBe(afterMount);
  });
});

// ---------------------------------------------------------------- P2-5

describe("SKU-P2-5 URL / 存储契约", () => {
  it("popstate 后按 URL 还原选择，脏值被忽略", async () => {
    const Sku = createSkuSelector([createUrlSyncPlugin()]);
    window.history.replaceState(null, "", "/?sku_%E9%A2%9C%E8%89%B2=red");
    await mount(<Sku attributes={attributes} variants={variants} />);
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );

    // 脏链接：值不存在 → 不写进选择态，矩阵仍可点
    window.history.replaceState(null, "", "/?sku_%E9%A2%9C%E8%89%B2=nope");
    await act(async () => {
      window.dispatchEvent(new Event("popstate"));
    });
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "false"
    );
    expect((q('[data-testid="sku-opt-尺码-m"]') as HTMLButtonElement).disabled).toBe(false);

    // 前进/后退带回合法选择 → UI 跟着 URL 还原
    window.history.replaceState(null, "", "/?sku_%E9%A2%9C%E8%89%B2=blue");
    await act(async () => {
      window.dispatchEvent(new Event("popstate"));
    });
    expect((q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );
  });

  it("StatePersistence 的 productKey 让不同商品互不串味", async () => {
    window.localStorage.setItem(
      "cart:sku:A",
      JSON.stringify({ 颜色: "blue", 尺码: "s" })
    );
    const SkuA = createSkuSelector([
      createStatePersistencePlugin({ key: "cart:sku", productKey: "A" }),
    ]);
    const SkuB = createSkuSelector([
      createStatePersistencePlugin({ key: "cart:sku", productKey: "B" }),
    ]);

    await mount(<SkuA attributes={attributes} variants={variants} />);
    expect((q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );

    await rerender(<SkuB attributes={attributes} variants={variants} />);
    expect((q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).dataset.selected).toBe(
      "false"
    );
  });
});

// ---------------------------------------------------------------- P2-6

describe("SKU-P2-6 运行时替换插件数组后 onMount 重新执行", () => {
  it("新插件注册后会跑一次 onMount，监听不丢", async () => {
    const Sku = createSkuSelector([]);
    let mounted = 0;
    const latePlugin: SkuPlugin = {
      name: "LatePlugin",
      version: "0.1.0",
      description: "late",
      priority: 1,
      hooks: {
        onMount: () => {
          mounted += 1;
        },
        renderHeader: () => <span data-testid="late-probe">late</span>,
      },
    };

    await mount(<Sku attributes={attributes} variants={variants} plugins={[]} />);
    expect(mounted).toBe(0);

    await rerender(
      <Sku attributes={attributes} variants={variants} plugins={[latePlugin]} />
    );
    expect(mounted).toBe(1);
    expect(q('[data-testid="late-probe"]')).toBeTruthy();
  });
});

// ---------------------------------------------------------------- P2-7

describe("SKU-P2-7 键盘漫游：方向键只移动焦点", () => {
  const Sku = createSkuSelector([createKeyboardNavPlugin()]);

  it("→ 只移动焦点不改变选择，点击（原生 Enter/Space）才选中", async () => {
    await mount(<Sku attributes={attributes} variants={variants} />);
    const red = q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement;
    const blue = q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement;

    red.focus();
    await act(async () => {
      red.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });

    expect(document.activeElement).toBe(blue);
    expect(blue.dataset.selected).toBe("false");

    await act(async () => {
      blue.click();
    });
    expect(blue.dataset.selected).toBe("true");
  });

  it("↓ 按完整候选列表的列位置落点，且行内只有一个 Tab 落点", async () => {
    await mount(<Sku attributes={attributes} variants={variants} />);
    const red = q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement;
    red.focus();
    await act(async () => {
      red.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    expect((document.activeElement as HTMLElement).dataset.testid).toBe("sku-opt-尺码-s");
    expect(
      (q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).dataset.selected
    ).toBe("false");

    const colorRow = q('[data-testid="sku-attr-颜色"]')!;
    expect(colorRow.getAttribute("role")).toBe("radiogroup");
    expect(colorRow.getAttribute("aria-label")).toBe("颜色");
    const tabbables = Array.from(colorRow.querySelectorAll("button")).filter(
      (b) => b.tabIndex === 0
    );
    expect(tabbables.length).toBe(1);
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLElement).getAttribute("role")).toBe(
      "radio"
    );
  });
});

// ---------------------------------------------------------------- P2-8

describe("SKU-P2-8 props 浅比较与摘要查表", () => {
  it("props 内容不变时 onPropsChange 不再触发", async () => {
    let propsChanges = 0;
    const watcher: SkuPlugin = {
      name: "PropsWatcher",
      version: "0.1.0",
      description: "count onPropsChange",
      priority: 1,
      hooks: {
        onPropsChange: () => {
          propsChanges += 1;
        },
      },
    };
    const Sku = createSkuSelector([watcher]);

    await mount(<Sku attributes={attributes} variants={variants} />);
    const before = propsChanges;
    // 新 props 对象但内容一致 → 浅比较命中，不触发钩子
    await rerender(<Sku attributes={attributes} variants={variants} />);
    expect(propsChanges).toBe(before);

    // 数据真的变了才触发
    await rerender(<Sku attributes={attributes} variants={variants.slice(0, 2)} />);
    expect(propsChanges).toBe(before + 1);
  });

  it("摘要按预建索引取 label，未选全时不渲染变体信息", async () => {
    await mount(
      <SkuBare
        attributes={attributes}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    expect(q('[data-testid="sku-summary"]')!.textContent).toContain("颜色:红");
    expect(q('[data-testid="sku-summary"]')!.textContent).toContain("尺码:S");
  });
});
