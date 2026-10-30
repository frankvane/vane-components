/**
 * 开抢提醒（子路径 vane-coupon/custom-plugins/RemindPlugin）
 */
import { createRemindPlugin as create } from "./create";
import type { RemindConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createRemindPlugin: CouponPluginCreator<RemindConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<RemindConfig>;

export type { RemindConfig };
