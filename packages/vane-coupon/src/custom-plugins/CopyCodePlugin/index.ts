/**
 * 券码复制（子路径 vane-coupon/custom-plugins/CopyCodePlugin）
 */
import { createCopyCodePlugin as create } from "./create";
import type { CopyCodeConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createCopyCodePlugin: CouponPluginCreator<CopyCodeConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<CopyCodeConfig>;

export type { CopyCodeConfig };
