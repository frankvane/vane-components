/**
 * 领取记录（子路径 vane-coupon/custom-plugins/HistoryPlugin）
 */
import { createHistoryPlugin as create } from "./create";
import type { HistoryConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createHistoryPlugin: CouponPluginCreator<HistoryConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<HistoryConfig>;

export type { HistoryConfig };
