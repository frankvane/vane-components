/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），与插件一同发布；
 *  2. `create.ts(x)` —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
// 注意：SkuPlugin 是非泛型接口（本身即 Plugin<SkuSelectorCoreProps, unknown>），
// 规格里写的 SkuPlugin<unknown> 在真实类型上不成立，这里用裸 SkuPlugin
import type { SkuPlugin } from "vane-sku";
import { createAnalyticsPlugin } from "vane-sku/custom-plugins/Analytics";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLink";
import { createKeyboardNavPlugin } from "vane-sku/custom-plugins/KeyboardNav";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLink";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRange";
import { createQuantityPlugin } from "vane-sku/custom-plugins/Quantity";
import { createQuotaPlugin } from "vane-sku/custom-plugins/Quota";
import { createResetBarPlugin } from "vane-sku/custom-plugins/ResetBar";
import { createSkuCodePlugin } from "vane-sku/custom-plugins/SkuCode";
import { createStatePersistencePlugin } from "vane-sku/custom-plugins/StatePersistence";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatus";
import { createUrlSyncPlugin } from "vane-sku/custom-plugins/UrlSync";

export type PluginGroup = "price" | "info" | "interaction";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  price: "价格与库存",
  info: "信息与联动",
  interaction: "选择与交互",
};

export const GROUP_ORDER: PluginGroup[] = ["price", "info", "interaction"];

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: Array<{ name: string; type: string; default: string; description: string }>;
  example?: string;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginInfo {
  /** 目录名，同时是插件 name，如 PriceLink */
  dir: string;
  /** 工厂名，如 createPriceLinkPlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => SkuPlugin;
}

const DOCS = import.meta.glob<PluginDocShape>("/src/custom-plugins/*/doc.json", {
  eager: true,
  import: "default",
});

const RAW = import.meta.glob<string>("/src/custom-plugins/*/create.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const dirOf = (path: string) =>
  path.replace(/^.*\/custom-plugins\//, "").replace(/\/.*$/, "");

function priorityOf(dir: string): number {
  const path = Object.keys(RAW).find((p) => dirOf(p) === dir);
  const src = path ? RAW[path] : "";
  const m = /priority:\s*(\d+)/.exec(src);
  return m ? Number(m[1]) : 0;
}

function docOf(dir: string): PluginDocShape {
  const path = Object.keys(DOCS).find((p) => dirOf(p) === dir);
  return path ? DOCS[path] : { name: dir, description: "（缺少 doc.json）" };
}

type Def = {
  dir: string;
  group: PluginGroup;
  make: () => SkuPlugin;
};

const DEFS: Def[] = [
  // ---------- price：价格与库存 ----------
  {
    dir: "PriceLink",
    group: "price",
    make: () => createPriceLinkPlugin({ discountText: "限时8折" }),
  },
  {
    dir: "PriceRange",
    group: "price",
    make: () => createPriceRangePlugin(),
  },
  {
    dir: "StockStatus",
    group: "price",
    make: () => createStockStatusPlugin({ lowStockThreshold: 5 }),
  },
  {
    dir: "Quota",
    group: "price",
    make: () => createQuotaPlugin({ purchasedCount: 1 }),
  },
  {
    dir: "Quantity",
    group: "price",
    make: () => createQuantityPlugin(),
  },

  // ---------- info：信息与联动 ----------
  {
    dir: "ImageLink",
    group: "info",
    make: () =>
      createImageLinkPlugin({ onImageChange: (img) => console.log("[sku] 主图 →", img) }),
  },
  {
    dir: "SkuCode",
    group: "info",
    make: () => createSkuCodePlugin(),
  },
  {
    dir: "Analytics",
    group: "info",
    make: () =>
      createAnalyticsPlugin({ onEvent: (e) => console.log("[sku] 埋点", e.name) }),
  },

  // ---------- interaction：选择与交互 ----------
  {
    dir: "ResetBar",
    group: "interaction",
    make: () => createResetBarPlugin(),
  },
  {
    dir: "KeyboardNav",
    group: "interaction",
    make: () => createKeyboardNavPlugin(),
  },
  {
    dir: "StatePersistence",
    group: "interaction",
    // 独立存储键：别和场景卡的默认键（vane-sku:selection）互相踩
    make: () => createStatePersistencePlugin({ key: "vane-sku:demo" }),
  },
  {
    dir: "UrlSync",
    group: "interaction",
    make: () => createUrlSyncPlugin(),
  },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir}Plugin`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    make: def.make,
  };
}).sort(
  (a, b) =>
    GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || b.priority - a.priority
);

/** 默认勾选：全部 12 个 —— 工坊的乐趣就是逐个取消，看每件长尾的代价 */
export const DEFAULT_ON = PLUGINS.map((p) => p.dir);
