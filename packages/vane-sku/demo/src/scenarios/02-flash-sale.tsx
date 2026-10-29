import React from "react";
import { createSkuSelector } from "vane-sku";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLink";
import { createQuantityPlugin } from "vane-sku/custom-plugins/Quantity";
import { createQuotaPlugin } from "vane-sku/custom-plugins/Quota";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatus";
import type { SkuAttribute, SkuVariant } from "vane-sku";
import type { ScenarioMeta } from "./types";

/**
 * 抢购专供矩阵：库存见底 + 全员限购 2。
 * 刻意缺 neon-l（售罄下架）：选荧光橙后 L 置灰，避免「付不了款的死单」。
 */
const FLASH_ATTRIBUTES: SkuAttribute[] = [
  {
    name: "颜色",
    options: [
      { id: "neon", label: "荧光橙" },
      { id: "black", label: "曜石黑" },
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

const FLASH_VARIANTS: SkuVariant[] = [
  { sku: "FLASH-NEON-S", attrValues: { 颜色: "neon", 尺码: "s" }, price: 89, originalPrice: 199, stock: 3, quota: 2 },
  { sku: "FLASH-NEON-M", attrValues: { 颜色: "neon", 尺码: "m" }, price: 89, originalPrice: 199, stock: 2, quota: 2 },
  // neon-l 售罄下架 → 选荧光橙后 L 置灰
  { sku: "FLASH-BLACK-M", attrValues: { 颜色: "black", 尺码: "m" }, price: 99, originalPrice: 219, stock: 4, quota: 2 },
  { sku: "FLASH-BLACK-L", attrValues: { 颜色: "black", 尺码: "l" }, price: 99, originalPrice: 219, stock: 1, quota: 2 },
];

/**
 * 02 · 限时抢购面板（对标聚划算）
 *
 * 抢购的三件事同时生效：折后价（PriceLink 原价删除线）、库存见底（StockStatus
 * 低库存阈值制造紧迫感）、限购校验（Quota 已购 1 / 限 2 + Quantity 上限收口）。
 * 只装这 4 个 —— 抢购页不需要货号与键盘漫游，就不付那份代价。
 */
export const meta: ScenarioMeta = {
  id: "flash-sale",
  title: "限时抢购面板",
  group: "营销活动",
  ref: { label: "聚划算", url: "https://ju.taobao.com" },
  pain: "限购 2 已购 1、库存见底、折后价同时生效",
  plugs: [
    { fn: "createPriceLinkPlugin", cfg: 'discountText: "抢购价"', why: "折后价 + 原价删除线，折扣角标换成抢购语境" },
    { fn: "createStockStatusPlugin", cfg: "lowStockThreshold: 3", why: "库存见底：仅剩 1–3 件的高亮读数就是催付文案" },
    { fn: "createQuotaPlugin", cfg: "purchasedCount: 1", why: "限购 2 已购 1：提示条 + canPurchase 门控" },
    { fn: "createQuantityPlugin", why: "数量上限取库存与限购较小值，别让用户凑满一车才发现在超限" },
  ],
  props: ['defaultSelection={{ 颜色: "neon", 尺码: "m" }}'],
  note: "荧光橙 / M：¥89 划掉 ¥199，库存 2 触发「仅剩 2 件」，限购 2 已购 1，数量步进上限被收口到 2。",
};

// 组件类型必须在模块级创建（渲染函数里每次调用都会造出新类型 → 重挂载 → 选择态丢失）
const Sku = createSkuSelector([
  createPriceLinkPlugin({ discountText: "抢购价" }),
  createStockStatusPlugin({ lowStockThreshold: 3 }),
  createQuotaPlugin({ purchasedCount: 1 }),
  createQuantityPlugin(),
]);

export default function FlashSaleScenario() {
  const [log, setLog] = React.useState<string[]>([]);

  return (
    <div
      className="sku-card"
      style={{
        maxWidth: 420,
        margin: "0 auto",
        background: "#fff",
        padding: 16,
        borderRadius: 3,
        color: "#1f2328",
      }}
    >
      <Sku
        attributes={FLASH_ATTRIBUTES}
        variants={FLASH_VARIANTS}
        defaultSelection={{ 颜色: "neon", 尺码: "m" }}
        onChange={(_sel, v) =>
          setLog((l) => [
            ...l.slice(-3),
            `${v ? `${v.sku} · 剩${v.stock}件` : "未命中"} · ${new Date().toLocaleTimeString()}`,
          ])
        }
      />
      <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#57606a" }}>
        {log.length ? `最近命中：${log[log.length - 1]}` : "数量步进的上限 = min(库存, 限购剩余) —— 这是抢购页最要紧的一道闸。"}
      </p>
    </div>
  );
}
