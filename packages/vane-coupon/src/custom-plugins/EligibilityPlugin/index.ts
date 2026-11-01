/**
 * EligibilityPlugin — 可用性判定（子路径 vane-coupon/custom-plugins/EligibilityPlugin）
 */
import { createEligibilityPlugin as create } from "./create";
import type { EligibilityConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createEligibilityPlugin: CouponPluginCreator<EligibilityConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<EligibilityConfig>;

export type { EligibilityConfig };
