import type {
  CouponEligibility,
  CouponOrderContext,
  CouponPlugin,
  CouponPluginContext,
} from "../../components/CouponPlugin/plugins/types";
import { evaluateEligibility } from "../../components/CouponPlugin/plugins/eligibility";

/**
 * EligibilityPlugin — 券可用性判定（不渲染任何 UI）。
 *
 * 把「当前订单能否用这张券」的判定结果写进内核 state.eligible：
 *   门槛 / 有效期 / 商品范围 / 互斥组 / 叠加规则 / 限领 / 库存（见 plugins/eligibility.ts）。
 * ClaimStatePlugin 渲染与点击都读同一结果（未装本插件时按 props.order 现算），
 * 宿主也可直接读 state.eligible 展示「差 X 元可用」「已购商品不适用」等提示。
 *
 * 未传 order 时不写 state（保持 null），避免用陈旧订单误锁按钮。
 * meta 在同目录 index.ts 挂载。
 */
export interface EligibilityConfig {
  /** 订单上下文（默认 props.order） */
  order?: CouponOrderContext;
  /** 每次判定后回调（供宿主展示不可用原因） */
  onEvaluate?: (result: CouponEligibility) => void;
}

export function createEligibilityPlugin(
  config: EligibilityConfig = {}
): CouponPlugin {
  const mergedConfig = { ...config } as any;

  const resolveOrder = (context: CouponPluginContext): CouponOrderContext | null =>
    config.order ?? context.order;

  const sameEligibility = (
    a: CouponEligibility | null | undefined,
    b: CouponEligibility | null
  ): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

  const evaluate = (context: CouponPluginContext): void => {
    const order = resolveOrder(context);
    const current = (context.state?.eligible ?? null) as CouponEligibility | null;
    if (!order) {
      // 没有订单上下文：清掉陈旧判定，领取按钮回到「不因订单被锁」
      if (!sameEligibility(current, null)) context.setState({ eligible: null });
      return;
    }
    const next = evaluateEligibility(context.coupon, order);
    if (!sameEligibility(current, next)) context.setState({ eligible: next });
    config.onEvaluate?.(next);
  };

  return {
    name: "eligibility",
    version: "0.1.0",
    description:
      "可用性判定：门槛 / 有效期 / 商品范围 / 互斥 / 叠加 / 限领 / 库存，结果写 state.eligible 供领取按钮与宿主复用",
    priority: 34,
    config: mergedConfig,
    hooks: {
      onMount: (context: CouponPluginContext) => {
        evaluate(context);
      },
      onPropsChange: (context: CouponPluginContext) => {
        evaluate(context);
      },
      onPhaseChange: (context: CouponPluginContext) => {
        // 领取后 claimedAt 落库：相对有效期的判定起点变了
        evaluate(context);
      },
    },
  };
}
