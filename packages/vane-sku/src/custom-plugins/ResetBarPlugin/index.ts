/**
 * ResetBarPlugin — 清空重选（子路径 vane-sku/custom-plugins/ResetBarPlugin）
 */
import { createResetBarPlugin as create } from "./create";
import type { ResetBarConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createResetBarPlugin: SkuPluginCreator<ResetBarConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<ResetBarConfig>;

export type { ResetBarConfig };
