import React from "react";
import { createSkuSelector } from "vane-sku";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLinkPlugin";
import { createKeyboardNavPlugin } from "vane-sku/custom-plugins/KeyboardNavPlugin";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRangePlugin";
import { createQuantityPlugin } from "vane-sku/custom-plugins/QuantityPlugin";
import { createQuotaPlugin } from "vane-sku/custom-plugins/QuotaPlugin";
import { createResetBarPlugin } from "vane-sku/custom-plugins/ResetBarPlugin";
import { createSkuCodePlugin } from "vane-sku/custom-plugins/SkuCodePlugin";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatusPlugin";
import type { ScenarioMeta } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

/**
 * 主图桥：模块级插件实例拿不到组件 state（装配发生在组件外），
 * 用一个极小的发布订阅把 onImageChange 的事件送进正在渲染的组件。
 * 真实项目里这层通常是 gallery 自己的 store —— 这里只为演示「事件出口」怎么接。
 */
const imageListeners = new Set<(img: string) => void>();

/**
 * 01 · 全功能商品规格面板（对标淘宝商品页）
 *
 * 9 个插件按 priority 串联：价格区（区间 → 命中显单价）/ 库存读数 / 限购门控 /
 * 数量步进 / 货号 / 清空重选 / 键盘漫游 / 规格切主图。
 * 内核只渲染规格按钮组（含禁用推导）与选中摘要，其余全是插件。
 */
export const meta: ScenarioMeta = {
  id: "full-panel",
  title: "全功能商品规格面板",
  group: "商品详情",
  ref: { label: "淘宝商品页", url: "https://item.taobao.com" },
  pain: "价格 / 库存 / 限购 / 数量 / 货号 / 清空要一起出现，还得键盘可逛",
  plugs: [
    { fn: "createPriceRangePlugin", why: "未选全时先给 ¥199–¥269 区间，选了颜色后随选择收窄" },
    { fn: "createPriceLinkPlugin", cfg: 'discountText: "限时8折"', why: "命中变体显单价 + 原价删除线 + 折扣角标" },
    { fn: "createStockStatusPlugin", cfg: "lowStockThreshold: 5", why: "库存读数：现货 / 仅剩 N 件 / 缺货" },
    { fn: "createQuotaPlugin", cfg: "purchasedCount: 1", why: "限购提示条 + canPurchase 门控（red-s 限购 2、已购 1）" },
    { fn: "createQuantityPlugin", why: "数量步进：上限取库存与限购的较小值" },
    { fn: "createSkuCodePlugin", why: "货号展示，客服对单 / 用户报修用" },
    { fn: "createResetBarPlugin", why: "选了一半想重来，一键清空" },
    { fn: "createKeyboardNavPlugin", why: "方向键在规格间漫游，自动跳过被推导置灰的死路选项" },
    { fn: "createImageLinkPlugin", why: "规格切主图：只发事件，主图由外层决定怎么渲染" },
  ],
  props: ['defaultSelection={{ 颜色: "red", 尺码: "s" }}'],
  note: "价格区只有一块：PriceRange 与 PriceLink 都走 overlay 段，命中变体后区间退场、把位置让给单价。主图联动是纯事件出口（onImageChange / sku:image 总线），面板本身不渲染图。",
};

// 组件类型必须在模块级创建（渲染函数里每次调用都会造出新类型 → 重挂载 → 选择态丢失）
const Sku = createSkuSelector([
  createPriceRangePlugin(),
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createStockStatusPlugin({ lowStockThreshold: 5 }),
  createQuotaPlugin({ purchasedCount: 1 }),
  createQuantityPlugin(),
  createSkuCodePlugin(),
  createResetBarPlugin(),
  createKeyboardNavPlugin(),
  createImageLinkPlugin({ onImageChange: (img) => imageListeners.forEach((l) => l(img)) }),
]);

export default function FullPanelScenario() {
  const [image, setImage] = React.useState(VARIANTS[0]?.image ?? "");
  const [log, setLog] = React.useState<string[]>([]);

  React.useEffect(() => {
    imageListeners.add(setImage);
    return () => {
      imageListeners.delete(setImage);
    };
  }, []);

  return (
    <div
      className="sku-card"
      style={{
        maxWidth: 460,
        margin: "0 auto",
        background: "#fff",
        padding: 16,
        borderRadius: 3,
        color: "#1f2328",
      }}
    >
      <img
        src={image}
        alt="变体主图"
        style={{
          width: 128,
          height: 128,
          objectFit: "cover",
          borderRadius: 3,
          display: "block",
          marginBottom: 10,
          background: "#f2f3f5",
        }}
      />
      <Sku
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onChange={(_sel, v) =>
          setLog((l) => [
            ...l.slice(-3),
            `${v ? v.sku : "未命中"} · ${new Date().toLocaleTimeString()}`,
          ])
        }
      />
      <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#57606a" }}>
        {log.length ? `最近命中：${log[log.length - 1]}` : "试试选「蓝」—— 没有 blue-l 变体，L 会被禁用推导置灰。"}
      </p>
    </div>
  );
}
