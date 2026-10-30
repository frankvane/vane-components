/**
 * ValidityPlugin — 有效期判定（子路径 vane-coupon/custom-plugins/ValidityPlugin）
 */
import { createValidityPlugin as create } from "./create";
import type { ValidityConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createValidityPlugin: CouponPluginCreator<ValidityConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<ValidityConfig>;

export type { ValidityConfig };
