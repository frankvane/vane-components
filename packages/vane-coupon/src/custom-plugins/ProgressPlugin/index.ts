/**
 * 领取进度（子路径 vane-coupon/custom-plugins/ProgressPlugin）
 */
import { createProgressPlugin as create } from "./create";
import type { ProgressConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createProgressPlugin: CouponPluginCreator<ProgressConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<ProgressConfig>;

export type { ProgressConfig };
