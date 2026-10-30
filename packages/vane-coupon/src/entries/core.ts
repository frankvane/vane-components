/**
 * 子路径入口 `vane-coupon/entries/core` —— 只要核心组件时导入这里，体积最小。
 * 仅 CouponCore + 其 props/ref 类型。
 */
export { CouponCore } from "../components/CouponPlugin/CouponCore";
export type {
  CouponCoreProps,
  CouponCoreRef,
  CouponData,
  CouponPhase,
} from "../components/CouponPlugin/plugins/types";
