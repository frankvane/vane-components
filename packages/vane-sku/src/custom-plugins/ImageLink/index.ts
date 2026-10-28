/**
 * ImageLinkPlugin — 规格切主图（子路径 vane-sku/custom-plugins/ImageLink）
 */
import { createImageLinkPlugin as create } from "./create";
import type { ImageLinkConfig } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createImageLinkPlugin: SkuPluginCreator<ImageLinkConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<ImageLinkConfig>;

export type { ImageLinkConfig };
