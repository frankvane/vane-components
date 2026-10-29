/**
 * SkuCodePlugin — 货号展示（子路径 vane-sku/custom-plugins/SkuCode）
 */
import { createSkuCodePlugin as create } from "./create";
import type { SkuCodeConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createSkuCodePlugin: SkuPluginCreator<SkuCodeConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<SkuCodeConfig>;

export type { SkuCodeConfig };
