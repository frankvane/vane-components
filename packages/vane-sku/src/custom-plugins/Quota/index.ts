/**
 * QuotaPlugin — 限购校验（子路径 vane-sku/custom-plugins/Quota）
 */
import { createQuotaPlugin as create } from "./create";
import type { QuotaConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createQuotaPlugin: SkuPluginCreator<QuotaConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<QuotaConfig>;

export type { QuotaConfig };
