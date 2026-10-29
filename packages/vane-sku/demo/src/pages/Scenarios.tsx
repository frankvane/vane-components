import React from "react";
import { createSkuSelector } from "../../../src";
import type { SkuAttribute, SkuVariant } from "../../../src";
import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createPriceRangePlugin } from "../../../src/custom-plugins/PriceRange";
import { createStockStatusPlugin } from "../../../src/custom-plugins/StockStatus";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createQuantityPlugin } from "../../../src/custom-plugins/Quantity";
import { createImageLinkPlugin } from "../../../src/custom-plugins/ImageLink";
import { createSkuCodePlugin } from "../../../src/custom-plugins/SkuCode";
import { createResetBarPlugin } from "../../../src/custom-plugins/ResetBar";
import { createKeyboardNavPlugin } from "../../../src/custom-plugins/KeyboardNav";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const COLOR_ATTR = ATTRIBUTES[0];
const SIZE_ATTR = ATTRIBUTES[1];
const TWO_COLOR: SkuAttribute = { ...COLOR_ATTR, options: COLOR_ATTR.options.slice(0, 2) };

const SkuBare = createSkuSelector([]);
const SkuRange = createSkuSelector([createPriceRangePlugin()]);
const SkuPriceStock = createSkuSelector([
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createStockStatusPlugin({ lowStockThreshold: 5 }),
]);
const SkuQuotaQty = createSkuSelector([
  createQuotaPlugin({ purchasedCount: 1 }),
  createQuantityPlugin(),
  createSkuCodePlugin(),
  createResetBarPlugin(),
]);
const SkuKeyboard = createSkuSelector([createKeyboardNavPlugin()]);

function ImageLinkScenario() {
  const [main, setMain] = React.useState(VARIANTS[0].image ?? "");
  const Sku = React.useMemo(
    () => createSkuSelector([createImageLinkPlugin({ onImageChange: setMain })]),
    []
  );
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <img
        data-testid="scenario-main-image"
        src={main}
        alt="主图"
        style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 2, border: "1px solid var(--line)" }}
      />
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
    </div>
  );
}

function Card({
  index,
  title,
  hint,
  children,
  testId,
}: {
  index: number;
  title: string;
  hint: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <article className="example-card" data-testid={testId}>
      <div className="example-head">
        <span className="example-index">{String(index).padStart(2, "0")}</span>
        <h3 className="example-name">{title}</h3>
      </div>
      <p className="example-desc">{hint}</p>
      <div className="example-stage">
        <div style={{ background: "#fff", borderRadius: 2, padding: 12, color: "#1f2328", width: "100%" }}>
          {children}
        </div>
      </div>
    </article>
  );
}

export function Scenarios() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">场景集</h1>
        <p className="page-desc">
          每个卡片一个主题，覆盖禁用推导、价格区间与联动、库存与限购、数量步进、
          规格切主图、缺货策略与键盘漫游。
        </p>
      </div>

      <div className="examples-grid">
        <Card
          index={1}
          testId="scn-disable"
          title="禁用推导"
          hint="缺 blue-l 变体 —— 点「蓝」后 L 自动置灰，点不中"
        >
          <SkuBare attributes={ATTRIBUTES} variants={VARIANTS} />
        </Card>

        <Card
          index={2}
          testId="scn-range"
          title="价格区间"
          hint="未选全时展示 ¥199–¥269；选了颜色后区间随选择收窄"
        >
          <SkuRange attributes={ATTRIBUTES} variants={VARIANTS} />
        </Card>

        <Card
          index={3}
          testId="scn-price-stock"
          title="价格联动 + 库存状态"
          hint="命中变体后显单价与原价删除线，并提示现货 / 仅剩 N 件"
        >
          <SkuPriceStock
            attributes={ATTRIBUTES}
            variants={VARIANTS}
            defaultSelection={{ 颜色: "red", 尺码: "s" }}
          />
        </Card>

        <Card
          index={4}
          testId="scn-quota-qty"
          title="限购 + 数量上限"
          hint="限购 2 / 已购 1，库存 5 → 数量上限取较小值 2，另有货号与清空重选"
        >
          <SkuQuotaQty
            attributes={ATTRIBUTES}
            variants={VARIANTS}
            defaultSelection={{ 颜色: "red", 尺码: "s" }}
          />
        </Card>

        <Card index={5} testId="scn-image" title="规格切主图" hint="ImageLink 只发事件，主图由外层渲染">
          <ImageLinkScenario />
        </Card>

        <Card
          index={6}
          testId="scn-ignore-stock"
          title="缺货是否参与推导"
          hint="green-l 库存 0：默认（开启）被置灰；关闭 ignoreOutOfStock 后可选"
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>ignoreOutOfStock = true（默认）</div>
              <SkuBare attributes={ATTRIBUTES} variants={VARIANTS} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>ignoreOutOfStock = false</div>
              <SkuBare attributes={ATTRIBUTES} variants={VARIANTS} ignoreOutOfStock={false} />
            </div>
          </div>
        </Card>

        <Card
          index={7}
          testId="scn-keyboard"
          title="键盘漫游"
          hint="点中任一规格按钮后，用 ←→ 同行切换、↑↓ 跨行跳转（自动跳过置灰项）"
        >
          <SkuKeyboard attributes={ATTRIBUTES} variants={VARIANTS} />
        </Card>

        <Card
          index={8}
          testId="scn-two-attr"
          title="双属性简版"
          hint="只留红/蓝两色，对比禁用推导在更小矩阵下的表现"
        >
          <SkuBare
            attributes={[TWO_COLOR, SIZE_ATTR]}
            variants={VARIANTS.filter((v) => v.attrValues["颜色"] !== "green")}
          />
        </Card>
      </div>
    </div>
  );
}
