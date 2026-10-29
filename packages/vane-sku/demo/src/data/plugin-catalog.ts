import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLink";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRange";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatus";
import { createQuotaPlugin } from "vane-sku/custom-plugins/Quota";
import { createQuantityPlugin } from "vane-sku/custom-plugins/Quantity";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLink";
import { createSkuCodePlugin } from "vane-sku/custom-plugins/SkuCode";
import { createResetBarPlugin } from "vane-sku/custom-plugins/ResetBar";
import { createKeyboardNavPlugin } from "vane-sku/custom-plugins/KeyboardNav";
import { createStatePersistencePlugin } from "vane-sku/custom-plugins/StatePersistence";
import { createUrlSyncPlugin } from "vane-sku/custom-plugins/UrlSync";
import { createAnalyticsPlugin } from "vane-sku/custom-plugins/Analytics";

/**
 * 插件目录：直接从各插件的 meta（doc.json）读，不手写第二份清单 ——
 * 插件改描述时这里自动跟着变，杜绝文档漂移。
 *
 * demo 字段指向 scenarios 里演示该插件的真实场景（同款预览 + 同款源码），
 * 插件页与场景页共用同一份实现，天然不会各说各话。
 */
export interface PluginEntry {
  id: string;
  group: string;
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  /** 是否渲染 UI（纯行为插件标注为 false） */
  renders: boolean;
  /** 插件页内嵌的实时演示，取自 scenarios/specs 的场景 id */
  demo: string;
}

interface Def {
  id: string;
  group: string;
  renders: boolean;
  demo: string;
  create: { meta?: { name: string; description: string; since?: string; tags?: string[] } };
}

const DEFS: Def[] = [
  { id: "PriceLink", group: "价格与库存", renders: true, demo: "price-stock", create: createPriceLinkPlugin },
  { id: "PriceRange", group: "价格与库存", renders: true, demo: "range", create: createPriceRangePlugin },
  { id: "StockStatus", group: "价格与库存", renders: true, demo: "price-stock", create: createStockStatusPlugin },
  { id: "Quota", group: "价格与库存", renders: true, demo: "quota-qty", create: createQuotaPlugin },
  { id: "Quantity", group: "价格与库存", renders: true, demo: "quota-qty", create: createQuantityPlugin },
  { id: "ImageLink", group: "信息与联动", renders: false, demo: "image", create: createImageLinkPlugin },
  { id: "SkuCode", group: "信息与联动", renders: true, demo: "quota-qty", create: createSkuCodePlugin },
  { id: "Analytics", group: "信息与联动", renders: false, demo: "analytics", create: createAnalyticsPlugin },
  { id: "ResetBar", group: "选择与交互", renders: true, demo: "quota-qty", create: createResetBarPlugin },
  { id: "KeyboardNav", group: "选择与交互", renders: false, demo: "keyboard", create: createKeyboardNavPlugin },
  { id: "StatePersistence", group: "选择与交互", renders: false, demo: "persistence", create: createStatePersistencePlugin },
  { id: "UrlSync", group: "选择与交互", renders: false, demo: "url-sync", create: createUrlSyncPlugin },
];

export const PLUGINS: PluginEntry[] = DEFS.map((d) => ({
  id: d.id,
  group: d.group,
  renders: d.renders,
  demo: d.demo,
  name: d.create.meta?.name ?? d.id,
  description: d.create.meta?.description ?? "",
  since: d.create.meta?.since,
  tags: d.create.meta?.tags,
}));

export const PLUGIN_GROUPS: Array<{ group: string; items: PluginEntry[] }> = [
  "价格与库存",
  "信息与联动",
  "选择与交互",
].map((group) => ({
  group,
  items: PLUGINS.filter((p) => p.group === group),
}));

export const PLUGIN_COUNT = PLUGINS.length;
