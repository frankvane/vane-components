/**
 * StatePersistencePlugin — 选择态持久化（子路径 vane-sku/custom-plugins/StatePersistencePlugin）
 */
import { createStatePersistencePlugin as create } from "./create";
import type { StatePersistenceConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createStatePersistencePlugin: SkuPluginCreator<StatePersistenceConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<StatePersistenceConfig>;

export type { StatePersistenceConfig };
