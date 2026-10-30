/**
 * 开抢倒计时（子路径 vane-coupon/custom-plugins/CountdownPlugin）
 */
import { createCountdownPlugin as create } from "./create";
import type { CountdownConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createCountdownPlugin: CouponPluginCreator<CountdownConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<CountdownConfig>;

export type { CountdownConfig };
