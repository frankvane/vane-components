/**
 * StockStatusPlugin — 库存状态（子路径 vane-sku/custom-plugins/StockStatus）
 */
import { createStockStatusPlugin as create } from "./create";
import type { StockStatusConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createStockStatusPlugin: SkuPluginCreator<StockStatusConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<StockStatusConfig>;

export type { StockStatusConfig };
