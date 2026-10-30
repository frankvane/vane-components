/**
 * ClaimStatePlugin — 领取状态机（子路径 vane-coupon/custom-plugins/ClaimStatePlugin）
 */
import { createClaimStatePlugin as create } from "./create";
import type { ClaimStateConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createClaimStatePlugin: CouponPluginCreator<ClaimStateConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<ClaimStateConfig>;

export type { ClaimStateConfig };
