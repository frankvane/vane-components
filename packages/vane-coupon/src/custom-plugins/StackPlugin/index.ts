/**
 * StackPlugin — 叠加态角标（子路径 vane-coupon/custom-plugins/StackPlugin）
 */
import { createStackPlugin as create } from "./create";
import type { StackConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createStackPlugin: CouponPluginCreator<StackConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<StackConfig>;

export type { StackConfig };
