/**
 * AnalyticsPlugin — 埋点上报（子路径 vane-sku/custom-plugins/AnalyticsPlugin）
 */
import { createAnalyticsPlugin as create } from "./create";
import type { AnalyticsConfig, AnalyticsEvent } from "./create";
import doc from "./doc.json";
import type { SkuPluginCreator } from "../../components/SkuPlugin/plugins/types";

export const createAnalyticsPlugin: SkuPluginCreator<AnalyticsConfig> =
  Object.assign(create, { meta: doc }) as SkuPluginCreator<AnalyticsConfig>;

export type { AnalyticsConfig, AnalyticsEvent };
