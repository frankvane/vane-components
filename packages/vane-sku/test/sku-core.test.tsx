import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSkuSelector } from "../src";
import type { SkuAttribute, SkuVariant } from "../src";

// 让 React 的 act() 安静（happy-dom 下需显式声明 act 环境）
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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

// blue-l 不存在 → 选蓝色后 L 应被置灰（禁用推导）
const variants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 5 },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
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

describe("SkuSelectorCore 渲染与禁用推导", () => {
  it("渲染全部规格按钮，且无对应变体的选项被置灰", async () => {
    await mount(
      <SkuTest attributes={attributes} variants={variants} />
    );

    expect(q('[data-testid="sku-attr-颜色"]')).toBeTruthy();
    expect(q('[data-testid="sku-attr-尺码"]')).toBeTruthy();

    // 尺码 l 没有任何变体 → disabled
    const l = q('[data-testid="sku-opt-尺码-l"]') as HTMLButtonElement;
    expect(l).toBeTruthy();
    expect(l.disabled).toBe(true);

    // 其它选项可选
    expect((q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).disabled).toBe(false);
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it("点击选项 → 选择生效 + 选中态 + 命中变体摘要", async () => {
    const onChange = vi.fn();
    await mount(
      <SkuTest attributes={attributes} variants={variants} onChange={onChange} />
    );

    await act(async () => {
      (q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).click();
    });
    await act(async () => {
      (q('[data-testid="sku-opt-尺码-m"]') as HTMLButtonElement).click();
    });

    expect(
      (q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected
    ).toBe("true");
    expect(onChange).toHaveBeenCalled();

    const summary = q('[data-testid="sku-summary-variant"]');
    expect(summary).toBeTruthy();
    expect(summary!.textContent).toContain("red-m");
  });

  it("选中蓝色后 L 仍置灰（禁用推导随选择联动）", async () => {
    await mount(<SkuTest attributes={attributes} variants={variants} />);

    await act(async () => {
      (q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement).click();
    });

    expect((q('[data-testid="sku-opt-尺码-l"]') as HTMLButtonElement).disabled).toBe(true);
    expect((q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it("再点一次同值 = 取消该属性选择", async () => {
    await mount(<SkuTest attributes={attributes} variants={variants} />);

    await act(async () => {
      (q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).click();
    });
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "true"
    );

    await act(async () => {
      (q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).click();
    });
    expect((q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement).dataset.selected).toBe(
      "false"
    );
  });

  it("默认规格首屏即生效", async () => {
    const onValid = vi.fn();
    await mount(
      <SkuTest
        attributes={attributes}
        variants={variants}
        defaultSelection={{ 颜色: "blue", 尺码: "s" }}
        onValidSkuChange={onValid}
      />
    );

    expect(q('[data-testid="sku-summary-variant"]')!.textContent).toContain("blue-s");
  });

  it("选到无可售组合时摘要提示「无可售组合」", async () => {
    await mount(<SkuTest attributes={attributes} variants={[]} />);
    expect(q('[data-testid="sku-summary"]')!.textContent).toContain("请选择规格");
  });
});

// 组件类型必须在模块级创建：写在渲染函数里会每次渲染生成新类型，
// React 判定为不同类型 → 重挂载 → 选择态丢失。
const Sku = createSkuSelector([]);

function SkuTest(props: {
  attributes: SkuAttribute[];
  variants: SkuVariant[];
  defaultSelection?: Record<string, string>;
  onChange?: (s: Record<string, string>, v: SkuVariant | null) => void;
  onValidSkuChange?: (v: SkuVariant) => void;
}) {
  return <Sku {...props} />;
}
