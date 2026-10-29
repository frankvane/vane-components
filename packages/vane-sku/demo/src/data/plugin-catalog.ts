import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createPriceRangePlugin } from "../../../src/custom-plugins/PriceRange";
import { createStockStatusPlugin } from "../../../src/custom-plugins/StockStatus";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createQuantityPlugin } from "../../../src/custom-plugins/Quantity";
import { createImageLinkPlugin } from "../../../src/custom-plugins/ImageLink";
import { createSkuCodePlugin } from "../../../src/custom-plugins/SkuCode";
import { createResetBarPlugin } from "../../../src/custom-plugins/ResetBar";
import { createKeyboardNavPlugin } from "../../../src/custom-plugins/KeyboardNav";
import { createStatePersistencePlugin } from "../../../src/custom-plugins/StatePersistence";
import { createUrlSyncPlugin } from "../../../src/custom-plugins/UrlSync";
import { createAnalyticsPlugin } from "../../../src/custom-plugins/Analytics";

/**
 * 插件目录：直接从各插件的 meta（doc.json）读，不手写第二份清单 ——
 * 插件改描述时这里自动跟着变，杜绝文档漂移。
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
}

interface Def {
  id: string;
  group: string;
  renders: boolean;
  create: { meta?: { name: string; description: string; since?: string; tags?: string[] } };
}

const DEFS: Def[] = [
  { id: "PriceLink", group: "价格与库存", renders: true, create: createPriceLinkPlugin },
  { id: "PriceRange", group: "价格与库存", renders: true, create: createPriceRangePlugin },
  { id: "StockStatus", group: "价格与库存", renders: true, create: createStockStatusPlugin },
  { id: "Quota", group: "价格与库存", renders: true, create: createQuotaPlugin },
  { id: "Quantity", group: "价格与库存", renders: true, create: createQuantityPlugin },
  { id: "ImageLink", group: "信息与联动", renders: false, create: createImageLinkPlugin },
  { id: "SkuCode", group: "信息与联动", renders: true, create: createSkuCodePlugin },
  { id: "Analytics", group: "信息与联动", renders: false, create: createAnalyticsPlugin },
  { id: "ResetBar", group: "选择与交互", renders: true, create: createResetBarPlugin },
  { id: "KeyboardNav", group: "选择与交互", renders: false, create: createKeyboardNavPlugin },
  { id: "StatePersistence", group: "选择与交互", renders: false, create: createStatePersistencePlugin },
  { id: "UrlSync", group: "选择与交互", renders: false, create: createUrlSyncPlugin },
];

export const PLUGINS: PluginEntry[] = DEFS.map((d) => ({
  id: d.id,
  group: d.group,
  renders: d.renders,
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
