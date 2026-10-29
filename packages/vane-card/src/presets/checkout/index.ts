/**
 * 配方：结算区（券 + 汇总 + 比价 + 埋点）
 *
 * 负责「钱」和「数据」这一侧：CouponRecommend 写 coupon.applied →
 * OrderSummary 读它算合计；ComparePrice 提供外部价格参照；
 * Analytics 通过总线事件与 Core 的可见性上报。
 *
 * 注意：本配方不含 SKU/Quantity（那是 sku-flow 的职责），
 * 两者叠加使用即可得到完整的交易卡。
 */

import type { CardPlugin } from "../../components/CardPlugin/plugins/types";
import {
  createCouponRecommendPlugin,
  type CouponRecommendPluginConfig,
} from "../../custom-plugins/CouponRecommendPlugin";
import type { Coupon } from "../../custom-plugins/CouponPlugin";
import {
  createOrderSummaryPlugin,
  type OrderSummaryPluginConfig,
} from "../../custom-plugins/OrderSummaryPlugin";
import {
  createComparePricePlugin,
  type ComparePricePluginConfig,
} from "../../custom-plugins/ComparePricePlugin";
import {
  createAnalyticsPlugin,
  type AnalyticsPluginConfig,
} from "../../custom-plugins/AnalyticsPlugin";

export interface CheckoutPresetOptions {
  /** 候选券（必填，为空则不装券插件） */
  coupons?: Coupon[];
  summary?: OrderSummaryPluginConfig;
  compare?: ComparePricePluginConfig;
  analytics?: AnalyticsPluginConfig;
  /** 券推荐插件的额外配置（placement / currency 等） */
  coupon?: Omit<CouponRecommendPluginConfig, "coupons">;
  omit?: Array<"coupon" | "summary" | "compare" | "analytics">;
}

export function checkoutPreset(
  options: CheckoutPresetOptions = {}
): CardPlugin[] {
  const omit = new Set(options.omit ?? []);
  const plugins: CardPlugin[] = [];

  if (!omit.has("coupon") && options.coupons?.length) {
    plugins.push(
      createCouponRecommendPlugin({
        ...options.coupon,
        coupons: options.coupons,
      })
    );
  }
  if (!omit.has("summary")) {
    plugins.push(createOrderSummaryPlugin({ ...options.summary }));
  }
  if (!omit.has("compare")) {
    plugins.push(createComparePricePlugin({ ...options.compare }));
  }
  if (!omit.has("analytics")) {
    plugins.push(createAnalyticsPlugin({ ...options.analytics }));
  }

  return plugins;
}

export default checkoutPreset;
