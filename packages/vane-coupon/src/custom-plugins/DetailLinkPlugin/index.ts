/**
 * 完整规则链接（子路径 vane-coupon/custom-plugins/DetailLinkPlugin）
 */
import { createDetailLinkPlugin as create } from "./create";
import type { DetailLinkConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createDetailLinkPlugin: CouponPluginCreator<DetailLinkConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<DetailLinkConfig>;

export type { DetailLinkConfig };
