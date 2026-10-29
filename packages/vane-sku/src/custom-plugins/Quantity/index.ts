/**
 * QuantityPlugin — 数量步进器（子路径 vane-sku/custom-plugins/Quantity）
 */
import { createQuantityPlugin as create } from "./create";
import type { QuantityConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createQuantityPlugin: SkuPluginCreator<QuantityConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<QuantityConfig>;

export type { QuantityConfig };
