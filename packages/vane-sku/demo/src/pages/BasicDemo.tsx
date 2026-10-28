import React from "react";
import { createSkuSelector } from "../../../src";
import type { SkuAttribute, SkuVariant } from "../../../src";
import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createImageLinkPlugin } from "../../../src/custom-plugins/ImageLink";

/**
 * 基础场景：颜色 × 尺码。
 * 故意让「蓝 + L」不存在变体 —— 选中蓝色后 L 应被禁用推导置灰（vane-sku 核心卖点）。
 */
const attributes: SkuAttribute[] = [
  {
    name: "颜色",
    options: [
      { id: "red", label: "红" },
      { id: "blue", label: "蓝" },
    ],
  },
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
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, originalPrice: 299, stock: 5, quota: 2 },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, originalPrice: 299, stock: 3, quota: 2 },
  { sku: "red-l", attrValues: { 颜色: "red", 尺码: "l" }, price: 239, stock: 0 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
  // blue-l 不存在 → 选蓝色后 L 被置灰
];

const Sku = createSkuSelector([
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createQuotaPlugin({ purchasedCount: 1 }),
  createImageLinkPlugin({ onImageChange: (img) => console.log("[sku] image →", img) }),
]);

export function BasicDemo() {
  const [log, setLog] = React.useState<string[]>([]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) 280px", gap: 16 }}>
      <div style={{ padding: 16, border: "1px solid #e3e6eb", borderRadius: 10, background: "#fff" }}>
        <Sku
          attributes={attributes}
          variants={variants}
          defaultSelection={{ 颜色: "red", 尺码: "s" }}
          onChange={(selection, variant) =>
            setLog((l) => [
              ...l.slice(-4),
              `选择 ${JSON.stringify(selection)} → ${variant ? variant.sku : "未命中"}`,
            ])
          }
        />
      </div>

      <div style={{ padding: 12, border: "1px dashed #d3d8df", borderRadius: 10, fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>事件日志</div>
        {log.length ? (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        ) : (
          <div style={{ opacity: 0.6 }}>点击规格试试（选蓝色观察 L 置灰）</div>
        )}
      </div>
    </div>
  );
}
