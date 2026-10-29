import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { createSkuSelector } from "../../../src";
import type { SkuAttribute, SkuVariant } from "../../../src";
import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createImageLinkPlugin } from "../../../src/custom-plugins/ImageLink";
import { createPriceRangePlugin } from "../../../src/custom-plugins/PriceRange";
import { createStockStatusPlugin } from "../../../src/custom-plugins/StockStatus";
import { createQuantityPlugin } from "../../../src/custom-plugins/Quantity";
import { createSkuCodePlugin } from "../../../src/custom-plugins/SkuCode";
import { createResetBarPlugin } from "../../../src/custom-plugins/ResetBar";
import { createKeyboardNavPlugin } from "../../../src/custom-plugins/KeyboardNav";
import { auditSku } from "./audit-sku";

/**
 * 浏览器内自测（?selftest=1）
 *
 * 为什么需要它：本仓库的浏览器工具链（截图 / DOM 快照）在部分环境下不可用，
 * 靠肉眼看截图也验不出「禁用推导是否真的置灰了」。这里把断言搬进真实浏览器：
 * 挂载真实组件 → 派发真实点击 → 读真实 DOM，结果写进 document.title 供外部读取。
 */
const COLOR_ATTR: SkuAttribute = {
  name: "颜色",
  options: [
    { id: "red", label: "红" },
    { id: "blue", label: "蓝" },
  ],
};
const SIZE_ATTR: SkuAttribute = {
  name: "尺码",
  options: [
    { id: "s", label: "S" },
    { id: "m", label: "M" },
    { id: "l", label: "L" },
  ],
};

// 缺 blue-l / red-l：选蓝后 L 应置灰
const variants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, originalPrice: 299, stock: 5, quota: 2, image: "https://example.com/red-s.jpg" },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
];

const SkuBare = createSkuSelector([]);
const SkuPrice = createSkuSelector([createPriceLinkPlugin({ discountText: "限时8折" })]);
const SkuQuotaOver = createSkuSelector([createQuotaPlugin({ purchasedCount: 2 })]);

/** 让 React 的被动 effect（useEffect）跑完 —— flushSync 只刷渲染，不刷 effect */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

async function mount(ui: React.ReactElement) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:0;top:0;width:520px;background:#fff";
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await tick();
  return {
    host,
    root,
    q: (sel: string) => host.querySelector(sel) as HTMLElement | null,
    click: async (sel: string) => {
      const el = host.querySelector(sel) as HTMLElement | null;
      if (!el) throw new Error(`找不到元素 ${sel}`);
      flushSync(() => el.click());
      await tick();
    },
  };
}

export interface SelfTestResult {
  total: number;
  passed: number;
  failed: string[];
}

export async function runSelfTest(): Promise<SelfTestResult> {
  const failed: string[] = [];
  let total = 0;
  const ok = (name: string, cond: boolean) => {
    total += 1;
    // 同步写入计数：卡住时能看出停在第几项
    document.title = `SELFTEST RUNNING ${total}`;
    if (!cond) failed.push(name);
  };

  // ---- 1. 禁用推导 ----
  {
    const t = await mount(<SkuBare attributes={[COLOR_ATTR, SIZE_ATTR]} variants={variants} />);
    const l = t.q('[data-testid="sku-opt-尺码-l"]') as HTMLButtonElement;
    ok("禁用推导：无变体的尺码 L 初始即置灰", !!l && l.disabled === true);
    ok("禁用推导：有变体的尺码 S 可选", (t.q('[data-testid="sku-opt-尺码-s"]') as HTMLButtonElement)?.disabled === false);

    await t.click('[data-testid="sku-opt-颜色-blue"]');
    ok(
      "禁用推导：选蓝后 L 仍置灰（blue-l 不存在）",
      (t.q('[data-testid="sku-opt-尺码-l"]') as HTMLButtonElement)?.disabled === true
    );
    await t.click('[data-testid="sku-opt-尺码-s"]');
    ok(
      "选择生效：蓝+S 命中变体 blue-s",
      t.q('[data-testid="sku-summary-variant"]')?.textContent?.includes("blue-s") === true
    );
    ok(
      "几何体检：无越界/负坐标/零尺寸/重叠",
      auditSku(t.host).problems.length === 0
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 2. 价格联动 ----
  {
    const t = await mount(
      <SkuPrice
        attributes={[COLOR_ATTR, SIZE_ATTR]}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    ok("价格联动：渲染价格区", !!t.q('[data-testid="sku-price"]'));
    ok(
      "价格联动：显示变体价 199",
      t.q('[data-testid="sku-price"]')?.textContent?.includes("199") === true
    );
    ok(
      "价格联动：原价删除线 299",
      t.q('[data-testid="sku-price-original"]')?.textContent?.includes("299") === true
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 3. 限购校验 ----
  {
    const t = await mount(
      <SkuQuotaOver
        attributes={[COLOR_ATTR, SIZE_ATTR]}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    ok("限购校验：渲染限购条", !!t.q('[data-testid="sku-quota"]'));
    ok(
      "限购校验：已购 2 / 限购 2 → canPurchase=false",
      t.q('[data-testid="sku-quota"]')?.getAttribute("data-can-purchase") === "false"
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 4. 规格切主图 ----
  {
    let main = "";
    const Sku = createSkuSelector([createImageLinkPlugin({ onImageChange: (img) => (main = img) })]);
    const t = await mount(
      <Sku
        attributes={[COLOR_ATTR, SIZE_ATTR]}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    );
    ok("切主图：命中带图变体时回调 onImageChange", main === "https://example.com/red-s.jpg");
    ok("切主图：自身不渲染 UI（无价格区）", t.q('[data-testid="sku-price"]') === null);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 5. 新增插件：价格区间 / 库存 / 数量 / 清空 / 货号 ----
  {
    const Sku = createSkuSelector([
      createPriceRangePlugin(),
      createStockStatusPlugin({ lowStockThreshold: 5 }),
      createQuantityPlugin(),
      createSkuCodePlugin(),
      createResetBarPlugin(),
    ]);
    const t = await mount(<Sku attributes={[COLOR_ATTR, SIZE_ATTR]} variants={variants} />);

    // 未选全 → 价格区间（本组样例最低 199 / 最高 229）
    const range = t.q('[data-testid="sku-price-range"]');
    ok("价格区间：未选全时展示区间", !!range);
    ok(
      "价格区间：含最低价 199 与最高价 229",
      !!range && range.textContent!.includes("199") && range.textContent!.includes("229")
    );

    await t.click('[data-testid="sku-opt-颜色-red"]');
    await t.click('[data-testid="sku-opt-尺码-s"]');

    // 命中 red-s：库存 5 / 限购 2
    const stock = t.q('[data-testid="sku-stock"]');
    ok("库存状态：命中变体后渲染", !!stock);
    ok("库存状态：库存 5 命中低库存阈值", stock?.getAttribute("data-stock") === "5");

    const qty = t.q('[data-testid="sku-quantity"]');
    ok("数量步进：上限取 min(库存5, 限购2)=2", qty?.getAttribute("data-max") === "2");

    ok("货号：显示命中变体编码", t.q('[data-testid="sku-code"]')?.textContent?.includes("red-s") === true);

    // 清空重选
    ok("清空重选：有选择时出现", !!t.q('[data-testid="sku-reset"]'));
    await t.click('[data-testid="sku-reset"]');
    ok(
      "清空重选：点击后取消该属性选择",
      (t.q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement)?.dataset.selected === "false"
    );

    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 6. 键盘漫游 ----
  {
    const Sku = createSkuSelector([createKeyboardNavPlugin()]);
    const t = await mount(<Sku attributes={[COLOR_ATTR, SIZE_ATTR]} variants={variants} />);
    const red = t.q('[data-testid="sku-opt-颜色-red"]') as HTMLButtonElement;
    // 注意：这里不能用 act() —— 生产构建里 React.act 直接抛错。
    // 派发原生事件后等一轮 tick，React 的批处理更新自会提交。
    red.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    ok(
      "键盘漫游：→ 键切到同属性下一个选项",
      (t.q('[data-testid="sku-opt-颜色-blue"]') as HTMLButtonElement)?.dataset.selected === "true"
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  return { total, passed: total - failed.length, failed };
}

/** 供 main.tsx 调用：跑完把结论写进 document.title，便于外部（无截图时）读取 */
export async function runSelfTestToTitle(): Promise<void> {
  // 先落一个「已启动」标记：便于区分「根本没跑」与「跑了一半卡住」
  document.title = "SELFTEST RUNNING";
  try {
    const r = await runSelfTest();
    document.title =
      r.failed.length === 0
        ? `SELFTEST OK ${r.passed}/${r.total}`
        : `SELFTEST FAIL ${r.passed}/${r.total} :: ${r.failed.join(" | ")}`;
  } catch (e) {
    document.title = `SELFTEST ERROR :: ${(e as Error).message}`;
  }
}
