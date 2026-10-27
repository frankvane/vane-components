/**
 * CardPlugin 自定义插件统一导出
 */

export { createImagePlugin } from "./ImagePlugin";
export type { ImagePluginConfig } from "./ImagePlugin";

export { createStatePlugin } from "./StatePlugin";
export type { StatePluginConfig } from "./StatePlugin";

export { createActionsPlugin } from "./ActionsPlugin";
export type { ActionsPluginConfig } from "./ActionsPlugin";

export { createBadgePlugin } from "./BadgePlugin";
export type { BadgePluginConfig } from "./BadgePlugin";

export { createHoverPlugin } from "./HoverPlugin";
export type { HoverPluginConfig } from "./HoverPlugin";

export { createAnimationPlugin } from "./AnimationPlugin";
export { createAnalyticsPlugin } from "./AnalyticsPlugin";
export { createCountdownPlugin } from "./CountdownPlugin";
export { createResponsivePlugin } from "./ResponsivePlugin";
export type { ResponsivePluginConfig } from "./ResponsivePlugin";
export { createReviewPlugin } from "./ReviewPlugin";
export type { ReviewPluginConfig } from "./ReviewPlugin";
export { createVideoPlugin } from "./VideoPlugin";
export type { VideoPluginConfig } from "./VideoPlugin";
export { createGalleryPlugin } from "./GalleryPlugin";
export type { GalleryPluginConfig } from "./GalleryPlugin";
export { createInventoryPlugin } from "./InventoryPlugin";
export type { InventoryPluginConfig } from "./InventoryPlugin";
export { createA11yPlugin } from "./A11yPlugin";
export type { A11yPluginConfig } from "./A11yPlugin";

// ===== 电商增强插件（新增）=====
export { createPriceCalculatorPlugin } from "./PriceCalculatorPlugin";
export type { PriceCalculatorPluginConfig } from "./PriceCalculatorPlugin";
export { createComparePricePlugin } from "./ComparePricePlugin";
export type { ComparePricePluginConfig } from "./ComparePricePlugin";
export { createOrderSummaryPlugin } from "./OrderSummaryPlugin";
export type { OrderSummaryPluginConfig } from "./OrderSummaryPlugin";
export { createCouponPlugin } from "./CouponPlugin";
export type { CouponPluginConfig, Coupon } from "./CouponPlugin";
export { createCouponRecommendPlugin } from "./CouponRecommendPlugin";
export type { CouponRecommendPluginConfig } from "./CouponRecommendPlugin";
export { createUserTagPlugin } from "./UserTagPlugin";
export type { UserTagPluginConfig, UserTag } from "./UserTagPlugin";
export { createSKUPlugin } from "./SKUPlugin";
export type { SKUPluginConfig, SKUAttribute, SKUVariant } from "./SKUPlugin";
export { createQuantityPlugin } from "./QuantityPlugin";
export type { QuantityPluginConfig } from "./QuantityPlugin";
