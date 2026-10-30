/**
 * RuleExpandPlugin — 规则展开/收起（子路径 vane-coupon/custom-plugins/RuleExpandPlugin）
 */
import { createRuleExpandPlugin as create } from "./create";
import type { RuleExpandConfig } from "./create";
import doc from "./doc.json";
import type { CouponPluginCreator } from "../../components/CouponPlugin/plugins/types";

export const createRuleExpandPlugin: CouponPluginCreator<RuleExpandConfig> =
  Object.assign(create, { meta: doc }) as CouponPluginCreator<RuleExpandConfig>;

export type { RuleExpandConfig };
