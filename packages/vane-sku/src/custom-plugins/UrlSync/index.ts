/**
 * UrlSyncPlugin — URL 同步（子路径 vane-sku/custom-plugins/UrlSync）
 */
import { createUrlSyncPlugin as create } from "./create";
import type { UrlSyncConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createUrlSyncPlugin: SkuPluginCreator<UrlSyncConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<UrlSyncConfig>;

export type { UrlSyncConfig };
