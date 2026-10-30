/**
 * 分享按钮（子路径 vane-coupon/custom-plugins/SharePlugin）
 */
import { createSharePlugin as create } from "./create";
import type { ShareConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createSharePlugin: CouponPluginCreator<ShareConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<ShareConfig>;

export type { ShareConfig };
