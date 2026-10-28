/**
 * PriceLinkPlugin — 价格联动（子路径 vane-sku/custom-plugins/PriceLink）
 */
import { createPriceLinkPlugin as create } from "./create";
import type { PriceLinkConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createPriceLinkPlugin: SkuPluginCreator<PriceLinkConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<PriceLinkConfig>;

export type { PriceLinkConfig };
