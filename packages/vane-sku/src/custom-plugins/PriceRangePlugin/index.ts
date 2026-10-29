/**
 * PriceRangePlugin — 价格区间（子路径 vane-sku/custom-plugins/PriceRangePlugin）
 */
import { createPriceRangePlugin as create } from "./create";
import type { PriceRangeConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createPriceRangePlugin: SkuPluginCreator<PriceRangeConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<PriceRangeConfig>;

export type { PriceRangeConfig };
