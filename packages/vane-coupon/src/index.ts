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

/**
 * 领域判定纯函数（无 React 依赖，可用于列表页/结算页预计算）：
 *   evaluateEligibility —— 门槛 / 有效期 / 商品范围 / 互斥 / 叠加 / 限领 / 库存
 *   formatAmount / resolveThreshold —— 面额与门槛展示口径（与 Core 一致）
 */
export { evaluateEligibility } from "./components/CouponPlugin/plugins/eligibility";
export {
  formatAmount,
  resolveThreshold,
  AMOUNT_FALLBACK,
} from "./components/CouponPlugin/plugins/format";
export { resolveStock } from "./components/CouponPlugin/plugins/stock";
export { resolveQuota } from "./components/CouponPlugin/plugins/quota";
export { computeValidity } from "./components/CouponPlugin/plugins/validity";

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
  CouponScope,
  CouponOrderItem,
  CouponOrderContext,
  CouponEligibility,
  CouponEligibilityReason,
} from "./components/CouponPlugin/plugins/types";

export type {
  StockState,
  StockOverrides,
} from "./components/CouponPlugin/plugins/stock";
export type {
  QuotaState,
  QuotaOverrides,
} from "./components/CouponPlugin/plugins/quota";
export type { ThresholdResolution } from "./components/CouponPlugin/plugins/format";
