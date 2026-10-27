/**
 * CardPlugin 自定义插件统一导出（22 个）
 *
 * 按职责分五组，顺序即文档与 demo 中的展示顺序：
 *   media       媒体渲染（图片 / 视频 / 轮播）
 *   buy         交易链路（SKU → 数量 → 价格 → 优惠 → 汇总 → 库存）
 *   display     纯展示（角标 / 标签 / 倒计时 / 评价 / 入场动画）
 *   interaction 交互（操作按钮 / 悬停反馈）
 *   infra       基础设施（状态 / 埋点 / 无障碍 / 响应式）
 *
 * 每个插件目录下都有一份 doc.json 作为文档真相，改配置项时请同步。
 */

// ===== media =====
export { createImagePlugin } from "./ImagePlugin";
export type { ImagePluginConfig } from "./ImagePlugin";

export { createVideoPlugin } from "./VideoPlugin";
export type { VideoPluginConfig } from "./VideoPlugin";

export { createGalleryPlugin } from "./GalleryPlugin";
export type { GalleryPluginConfig } from "./GalleryPlugin";

// ===== buy =====
export { createSKUPlugin } from "./SKUPlugin";
export type { SKUPluginConfig, SKUAttribute, SKUVariant } from "./SKUPlugin";

export { createQuantityPlugin } from "./QuantityPlugin";
export type { QuantityPluginConfig } from "./QuantityPlugin";

export { createPriceCalculatorPlugin } from "./PriceCalculatorPlugin";
export type { PriceCalculatorPluginConfig } from "./PriceCalculatorPlugin";

export { createComparePricePlugin } from "./ComparePricePlugin";
export type { ComparePricePluginConfig } from "./ComparePricePlugin";

export { createCouponPlugin } from "./CouponPlugin";
export type { CouponPluginConfig, Coupon } from "./CouponPlugin";

export { createCouponRecommendPlugin } from "./CouponRecommendPlugin";
export type { CouponRecommendPluginConfig } from "./CouponRecommendPlugin";

export { createOrderSummaryPlugin } from "./OrderSummaryPlugin";
export type { OrderSummaryPluginConfig } from "./OrderSummaryPlugin";

export { createInventoryPlugin } from "./InventoryPlugin";
export type { InventoryPluginConfig } from "./InventoryPlugin";

// ===== display =====
export { createBadgePlugin } from "./BadgePlugin";
export type { BadgePluginConfig } from "./BadgePlugin";

export { createUserTagPlugin } from "./UserTagPlugin";
export type { UserTagPluginConfig, UserTag } from "./UserTagPlugin";

export { createCountdownPlugin } from "./CountdownPlugin";
export type { CountdownPluginConfig } from "./CountdownPlugin";

export { createReviewPlugin } from "./ReviewPlugin";
export type { ReviewPluginConfig } from "./ReviewPlugin";

// AnimationPlugin 无配置项（工厂不接收参数），故不导出 config 类型
export { createAnimationPlugin } from "./AnimationPlugin";

// ===== interaction =====
export { createActionsPlugin } from "./ActionsPlugin";
export type { ActionsPluginConfig } from "./ActionsPlugin";

export { createHoverPlugin } from "./HoverPlugin";
export type { HoverPluginConfig } from "./HoverPlugin";

// ===== infra =====
export { createStatePlugin } from "./StatePlugin";
export type { StatePluginConfig } from "./StatePlugin";

export { createAnalyticsPlugin } from "./AnalyticsPlugin";
export type { AnalyticsPluginConfig } from "./AnalyticsPlugin";

export { createA11yPlugin } from "./A11yPlugin";
export type { A11yPluginConfig } from "./A11yPlugin";

export { createResponsivePlugin } from "./ResponsivePlugin";
export type { ResponsivePluginConfig } from "./ResponsivePlugin";
