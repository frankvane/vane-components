/**
 * 每人限领（子路径 vane-coupon/custom-plugins/QuotaPlugin）
 */
import { createQuotaPlugin as create } from "./create";
import type { QuotaConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createQuotaPlugin: CouponPluginCreator<QuotaConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<QuotaConfig>;

export type { QuotaConfig };
