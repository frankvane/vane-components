/**
 * KeyboardNavPlugin — 键盘漫游（子路径 vane-sku/custom-plugins/KeyboardNav）
 */
import { createKeyboardNavPlugin as create } from "./create";
import type { KeyboardNavConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createKeyboardNavPlugin: SkuPluginCreator<KeyboardNavConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<KeyboardNavConfig>;

export type { KeyboardNavConfig };
