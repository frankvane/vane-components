/**
 * 渠道限定角标（子路径 vane-coupon/custom-plugins/ChannelPlugin）
 */
import { createChannelPlugin as create } from "./create";
import type { ChannelConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createChannelPlugin: CouponPluginCreator<ChannelConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<ChannelConfig>;

export type { ChannelConfig };
