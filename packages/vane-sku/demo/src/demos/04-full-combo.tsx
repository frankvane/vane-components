import React, { useMemo, useState } from "react";
import { createSkuSelector } from "vane-sku";
import { createAnalyticsPlugin } from "vane-sku/custom-plugins/AnalyticsPlugin";
import type { AnalyticsEvent } from "vane-sku/custom-plugins/AnalyticsPlugin";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLinkPlugin";
import { createKeyboardNavPlugin } from "vane-sku/custom-plugins/KeyboardNavPlugin";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRangePlugin";
import { createQuantityPlugin } from "vane-sku/custom-plugins/QuantityPlugin";
import { createQuotaPlugin } from "vane-sku/custom-plugins/QuotaPlugin";
import { createResetBarPlugin } from "vane-sku/custom-plugins/ResetBarPlugin";
import { createSkuCodePlugin } from "vane-sku/custom-plugins/SkuCodePlugin";
import { createStatePersistencePlugin } from "vane-sku/custom-plugins/StatePersistencePlugin";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatusPlugin";
import { createUrlSyncPlugin } from "vane-sku/custom-plugins/UrlSyncPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const EVENT_LABEL: Record<AnalyticsEvent["name"], string> = {
  "sku:mount": "挂载",
  "sku:change": "命中",
  "sku:invalid": "未命中",
};

/**
 * 04 · 全量装配（高级功能）
 * 12 个官方插件全装上：价格区间 / 价格联动 / 库存 / 限购 / 数量 / 货号 / 清空重选 /
 * 主图联动 / 键盘漫游 / URL 同步 / 埋点 / 本机记忆 —— 一个能直接上线的商品规格面板。
 * Analytics 的事件出口接到右栏日志，拖开关就是换装配。
 */
export const meta: DemoMeta = {
  slug: "full-combo",
  title: "全量装配：商品规格面板",
  group: "advanced",
  capability: "full-assembly",
  intro: "12 个官方插件全装配成商品规格面板：价格、库存、限购、数量、主图、键盘、埋点一次到位。",
  why: "真实商品详情页要的能力就这么多；要哪些装哪些，不要的子路径不进包——这就是按需插件的意义。",
  plugs: [
    { fn: "createPriceRangePlugin", why: "未选全时兜底显示价格区间" },
    { fn: "createPriceLinkPlugin", cfg: "discountText: '限时8折'", why: "命中后显示单价与原价删除线" },
    { fn: "createStockStatusPlugin", cfg: "lowStockThreshold: 5", why: "库存三态：现货 / 仅剩 N 件 / 缺货" },
    { fn: "createQuotaPlugin", cfg: "purchasedCount: 1", why: "限购提示条 + canPurchase 门控" },
    { fn: "createQuantityPlugin", why: "数量步进，上限取库存与限购较小值" },
    { fn: "createSkuCodePlugin", why: "命中后展示货号，客服对单用" },
    { fn: "createResetBarPlugin", why: "一键清空重选" },
    { fn: "createImageLinkPlugin", cfg: "onImageChange: setMainImage", why: "规格切主图（只发事件，主图在左侧）" },
    { fn: "createKeyboardNavPlugin", why: "方向键漫游规格，跳过置灰项" },
    { fn: "createUrlSyncPlugin", why: "选择写进查询串，可分享还原" },
    { fn: "createAnalyticsPlugin", cfg: "onEvent: (e) => track(e)", why: "挂载 / 命中 / 未命中事件接入右栏日志" },
    { fn: "createStatePersistencePlugin", cfg: "key: 'vane-sku:demo:selection'", why: "本机记住上次选择" },
  ],
  props: ["attributes={attributes}", "variants={variants}", "defaultSelection={{ 颜色: 'red', 尺码: 's' }}"],
  note: "UrlSync 默认 replaceState 不污染历史栈；它与 StatePersistence 可共存——一个负责可分享，一个负责本机记忆。",
  controls: [
    { key: "keyboard", label: "键盘漫游", kind: "switch", init: true },
    { key: "analytics", label: "埋点上报", kind: "switch", init: true, nonLayout: true },
    { key: "urlSync", label: "URL 同步", kind: "switch", init: false },
  ],
  stageHeight: 520,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const withKeyboard = Boolean(cfg.keyboard);
  const withAnalytics = Boolean(cfg.analytics);
  const withUrlSync = Boolean(cfg.urlSync);
  const [main, setMain] = useState(VARIANTS[0].image ?? "");

  // 三个开关增删插件：组件类型随真实依赖项重建；log 来自页面层 useCallback、setState 恒稳定
  const Sku = useMemo(
    () =>
      createSkuSelector([
        createPriceRangePlugin(),
        createPriceLinkPlugin({ discountText: "限时8折" }),
        createStockStatusPlugin({ lowStockThreshold: 5 }),
        createQuotaPlugin({
          purchasedCount: 1,
          onExceed: () => log("触及限购上限（red-s 每人限购 2 件）", "warn"),
        }),
        createQuantityPlugin({ onChange: (q) => log(`数量 → ${q}`) }),
        createSkuCodePlugin(),
        createResetBarPlugin({ onReset: () => log("已清空重选", "info") }),
        createImageLinkPlugin({
          onImageChange: (img) => {
            setMain(img);
            log(`主图 → ${img}`);
          },
        }),
        ...(withKeyboard ? [createKeyboardNavPlugin()] : []),
        ...(withUrlSync ? [createUrlSyncPlugin()] : []),
        ...(withAnalytics
          ? [
              createAnalyticsPlugin({
                onEvent: (e) =>
                  log(
                    `${EVENT_LABEL[e.name]} · ${JSON.stringify(e.selection)}${e.variant ? ` → ${e.variant.sku}` : ""}`,
                    e.name === "sku:invalid" ? "warn" : e.name === "sku:mount" ? "info" : "event"
                  ),
              }),
            ]
          : []),
        createStatePersistencePlugin({ key: "vane-sku:demo:full-combo" }),
      ]),
    [withKeyboard, withUrlSync, withAnalytics, log, setMain]
  );

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%" }}>
      <img
        src={main}
        alt="主图"
        style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 2, border: "1px solid var(--line)" }}
      />
      <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", flex: 1 }}>
        <Sku
          attributes={ATTRIBUTES}
          variants={VARIANTS}
          defaultSelection={{ 颜色: "red", 尺码: "s" }}
        />
        <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
          预选了 red/s：价格删除线、库存提示、限购条、数量步进、货号一次全出；换「绿 M」看低库存态。
        </p>
      </div>
    </div>
  );
}
