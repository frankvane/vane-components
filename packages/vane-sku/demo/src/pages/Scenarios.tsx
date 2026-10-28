import React from "react";
import { createSkuSelector } from "../../../src";
import type { SkuAttribute, SkuVariant } from "../../../src";
import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createImageLinkPlugin } from "../../../src/custom-plugins/ImageLink";

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

// 缺 blue-l
const baseVariants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, originalPrice: 299, stock: 5 },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
];

const SkuBare = createSkuSelector([]);
const SkuPrice = createSkuSelector([createPriceLinkPlugin({ discountText: "限时8折" })]);
const SkuQuotaOk = createSkuSelector([createQuotaPlugin({ purchasedCount: 1 })]);
const SkuQuotaOver = createSkuSelector([createQuotaPlugin({ purchasedCount: 2 })]);

/** 主图联动：ImageLink 把变体图抛给外层 */
function ImageLinkScenario() {
  const [main, setMain] = React.useState("https://picsum.photos/seed/red-s/200/200");
  const Sku = React.useMemo(
    () => createSkuSelector([createImageLinkPlugin({ onImageChange: setMain })]),
    []
  );
  const variants: SkuVariant[] = [
    { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, image: "https://picsum.photos/seed/red-s/200/200" },
    { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, image: "https://picsum.photos/seed/red-m/200/200" },
    { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, image: "https://picsum.photos/seed/blue-s/200/200" },
    { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, image: "https://picsum.photos/seed/blue-m/200/200" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <img
        data-testid="scenario-main-image"
        src={main}
        alt="主图"
        style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #e3e6eb" }}
      />
      <Sku
        attributes={[COLOR_ATTR, SIZE_ATTR]}
        variants={variants}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    </div>
  );
}

function Card({
  title,
  hint,
  children,
  testId,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <section
      data-testid={testId}
      style={{ padding: 14, border: "1px solid #e3e6eb", borderRadius: 10, background: "#fff" }}
    >
      <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{title}</h3>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>{hint}</p>
      {children}
    </section>
  );
}

export function Scenarios() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
      <Card
        testId="scn-disable"
        title="① 禁用推导"
        hint="缺 blue-l 变体 —— 点「蓝」后 L 自动置灰，点不中"
      >
        <SkuBare attributes={[COLOR_ATTR, SIZE_ATTR]} variants={baseVariants} />
      </Card>

      <Card
        testId="scn-price"
        title="② 价格联动"
        hint="PriceLink：变体价 + 原价删除线 + 折扣文案"
      >
        <SkuPrice
          attributes={[COLOR_ATTR, SIZE_ATTR]}
          variants={baseVariants}
          defaultSelection={{ 颜色: "red", 尺码: "s" }}
        />
      </Card>

      <Card testId="scn-quota-ok" title="③ 限购未超限" hint="限购 2 件 / 已购 1 件 → 可继续购买">
        <SkuQuotaOk
          attributes={[COLOR_ATTR, SIZE_ATTR]}
          variants={baseVariants.map((v) => ({ ...v, quota: 2 }))}
          defaultSelection={{ 颜色: "red", 尺码: "s" }}
        />
      </Card>

      <Card testId="scn-quota-over" title="④ 限购已超限" hint="限购 2 件 / 已购 2 件 → 提示已达上限">
        <SkuQuotaOver
          attributes={[COLOR_ATTR, SIZE_ATTR]}
          variants={baseVariants.map((v) => ({ ...v, quota: 2 }))}
          defaultSelection={{ 颜色: "red", 尺码: "s" }}
        />
      </Card>

      <Card testId="scn-image" title="⑤ 规格切主图" hint="ImageLink 只发事件，主图由外层渲染">
        <ImageLinkScenario />
      </Card>

      <Card
        testId="scn-ignore-stock"
        title="⑥ 缺货是否参与推导"
        hint="green-l 库存 0：默认（开启）被置灰；关闭 ignoreOutOfStock 后可选"
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>ignoreOutOfStock=true（默认）</div>
            <SkuBare
              attributes={[COLOR_ATTR, SIZE_ATTR]}
              variants={[
                { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, stock: 5 },
                { sku: "green-l", attrValues: { 颜色: "green", 尺码: "l" }, stock: 0 },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>ignoreOutOfStock=false</div>
            <SkuBare
              attributes={[
                { name: "颜色", options: [{ id: "red", label: "红" }, { id: "green", label: "绿" }] },
                SIZE_ATTR,
              ]}
              variants={[
                { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, stock: 5 },
                { sku: "green-l", attrValues: { 颜色: "green", 尺码: "l" }, stock: 0 },
              ]}
              ignoreOutOfStock={false}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
