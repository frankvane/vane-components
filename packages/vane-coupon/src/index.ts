/**
 * vane-coupon 主入口（子路径 "."）
 *
 * 只导出「核心 + 装配 + 类型」，插件一律走子路径按需引入（ADR-6）：
 *   import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";
 */
export { CouponCore } from "./components/CouponPlugin/CouponCore";
export { withPlugins } from "./components/CouponPlugin/withPlugins";
export {
  createCouponCard,
  CouponCard,
} from "./components/CouponPlugin/createCoupon";

export type {
  CouponData,
  CouponPhase,
  CouponValidity,
  CouponValidityMode,
  CouponSlots,
  CouponCoreProps,
  CouponCoreRef,
  CouponPlugin,
  CouponPluginContext,
  CouponPluginCreator,
  CouponPluginHooks,
} from "./components/CouponPlugin/plugins/types";
