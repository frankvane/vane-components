/**
 * 子路径入口 `vane-card/custom-plugins`（桶文件 · 22 个插件）
 *
 * 桶文件是「逃生口」：一次拿全量，适合工坊 / 内部后台 / 原型。
 * 真实的业务包更推荐逐插件子路径引入（`vane-card/custom-plugins/SKUPlugin`）——
 * 每个薄壳只指向自己那一份实现，不牵动其余 21 个。
 *
 * 分组与实现桶保持一致（media / buy / display / interaction / infra），
 * 顺序即文档与工坊里的展示顺序。
 */

export * from "./ImagePlugin";
export * from "./VideoPlugin";
export * from "./GalleryPlugin";

export * from "./SKUPlugin";
export * from "./QuantityPlugin";
export * from "./PriceCalculatorPlugin";
export * from "./ComparePricePlugin";
export * from "./CouponPlugin";
export * from "./CouponRecommendPlugin";
export * from "./OrderSummaryPlugin";
export * from "./InventoryPlugin";

export * from "./BadgePlugin";
export * from "./UserTagPlugin";
export * from "./CountdownPlugin";
export * from "./ReviewPlugin";
export * from "./AnimationPlugin";

export * from "./ActionsPlugin";
export * from "./HoverPlugin";

export * from "./StatePlugin";
export * from "./AnalyticsPlugin";
export * from "./A11yPlugin";
export * from "./ResponsivePlugin";
