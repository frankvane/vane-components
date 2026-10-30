/**
 * 券埋点（子路径 vane-coupon/custom-plugins/AnalyticsPlugin）
 */
import { createAnalyticsPlugin as create } from "./create";
import type { AnalyticsConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createAnalyticsPlugin: CouponPluginCreator<AnalyticsConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<AnalyticsConfig>;

export type { AnalyticsConfig };
