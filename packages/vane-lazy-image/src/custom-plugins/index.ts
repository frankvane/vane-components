/**
 * 自定义插件统一入口（桶文件）。
 * 每个插件可独立子路径引入：vane-lazy-image/custom-plugins/<XxxPlugin>
 * 此文件仅作聚合导出，tree-shaking 按需引入时不会被完整打包。
 *
 * 按 8 大领域分组（ADR-6：只分组，不淘汰）；分组与 doc.json 的 tags 一致。
 */

// ---------- 视觉与效果 ----------
export { createAspectRatioSpacerPlugin } from "./AspectRatioSpacerPlugin";
export type { AspectRatioSpacerConfig } from "./AspectRatioSpacerPlugin";
export { createBadgePlugin } from "./BadgePlugin";
export type { BadgePluginConfig } from "./BadgePlugin";
export { createBlurUpPlugin } from "./BlurUpPlugin";
export type { BlurUpConfig } from "./BlurUpPlugin";
export { createBorderGlowPlugin } from "./BorderGlowPlugin";
export type { BorderGlowPluginConfig } from "./BorderGlowPlugin";
export { createCaptionPlugin } from "./CaptionPlugin";
export type { CaptionPluginConfig } from "./CaptionPlugin";
export { createColorExtractionPlugin } from "./ColorExtractionPlugin";
export type { ColorExtractionConfig } from "./ColorExtractionPlugin";
export { createComparisonPlugin } from "./ComparisonPlugin";
export type { ComparisonPluginConfig } from "./ComparisonPlugin";
export { createCropPlugin } from "./CropPlugin";
export type { CropPluginConfig } from "./CropPlugin";
export { createDominantColorPlugin } from "./DominantColorPlugin";
export type { DominantColorConfig } from "./DominantColorPlugin";
export { createFadeInPlugin } from "./FadeInPlugin";
export type { FadeInConfig } from "./FadeInPlugin";
export { createFilterPlugin } from "./FilterPlugin";
export type { FilterPluginConfig } from "./FilterPlugin";
export { FILTER_PRESETS } from "./FilterPlugin";
export { createGalleryPlugin } from "./GalleryPlugin";
export type { GalleryPluginConfig } from "./GalleryPlugin";
export { createHoverZoomPlugin } from "./HoverZoomPlugin";
export type { HoverZoomPluginConfig } from "./HoverZoomPlugin";
export { createLqipPlugin } from "./LQIPPlugin";
export type { LqipPluginConfig } from "./LQIPPlugin";
export { createOverlayInfoPlugin } from "./OverlayInfoPlugin";
export type { OverlayInfoConfig } from "./OverlayInfoPlugin";
export { createParallaxPlugin } from "./ParallaxPlugin";
export type { ParallaxConfig } from "./ParallaxPlugin";
export { createProgressOverlayPlugin } from "./ProgressOverlayPlugin";
export type { ProgressOverlayConfig } from "./ProgressOverlayPlugin";
export { createRedactionPlugin } from "./RedactionPlugin";
export type { RedactionConfig } from "./RedactionPlugin";
export { createSkeletonPlugin } from "./SkeletonPlugin";
export type { SkeletonPluginConfig } from "./SkeletonPlugin";
export { createSvgPlaceholderPlugin } from "./SvgPlaceholderPlugin";
export type { SvgPlaceholderConfig } from "./SvgPlaceholderPlugin";
export { createTransitionPlugin } from "./TransitionPlugin";
export type { TransitionPluginConfig } from "./TransitionPlugin";
export { createWatermarkPlugin } from "./WatermarkPlugin";
export type { WatermarkPluginConfig } from "./WatermarkPlugin";

// ---------- 加载策略 ----------
export { createBatteryAwarePlugin } from "./BatteryAwarePlugin";
export type { BatteryAwareConfig } from "./BatteryAwarePlugin";
export { createConcurrencyControlPlugin } from "./ConcurrencyControlPlugin";
export type { ConcurrencyControlConfig } from "./ConcurrencyControlPlugin";
export { createDataSaverPlugin } from "./DataSaverPlugin";
export type { DataSaverPluginConfig } from "./DataSaverPlugin";
export { createDecodeAfterIdlePlugin } from "./DecodeAfterIdlePlugin";
export type { DecodeAfterIdleConfig } from "./DecodeAfterIdlePlugin";
export { createExifOrientationPlugin } from "./ExifOrientationPlugin";
export type { ExifOrientationConfig } from "./ExifOrientationPlugin";
export { createFetchLoaderPlugin } from "./FetchLoaderPlugin";
export type { FetchLoaderPluginConfig } from "./FetchLoaderPlugin";
export { createHoverPrefetchPlugin } from "./HoverPrefetchPlugin";
export type { HoverPrefetchConfig } from "./HoverPrefetchPlugin";
export { createMemoryPressureAbortPlugin } from "./MemoryPressureAbortPlugin";
export type { MemoryPressureAbortConfig } from "./MemoryPressureAbortPlugin";
export { createOfflinePlugin } from "./OfflinePlugin";
export type { OfflinePluginConfig } from "./OfflinePlugin";
export { createPreconnectPlugin } from "./PreconnectPlugin";
export type { PreconnectPluginConfig } from "./PreconnectPlugin";
export { createPredictiveLoadingPlugin } from "./PredictiveLoadingPlugin";
export type { PredictiveLoadingPluginConfig } from "./PredictiveLoadingPlugin";
export { createPriorityLoadingPlugin } from "./PriorityLoadingPlugin";
export type { PriorityLoadingConfig } from "./PriorityLoadingPlugin";
export { createScrollIdlePlugin } from "./ScrollIdlePlugin";
export type { ScrollIdleConfig } from "./ScrollIdlePlugin";
export { createViewportDebouncePlugin } from "./ViewportDebouncePlugin";
export type { ViewportDebounceConfig } from "./ViewportDebouncePlugin";

// ---------- 缓存 ----------
export { createIDBCachePlugin } from "./CacheIDBPlugin";
export type { IDBCacheConfig } from "./CacheIDBPlugin";
export { IDBCache } from "./CacheIDBPlugin";
export { createMemoryCachePlugin } from "./CacheMemoryPlugin";
export type { MemoryCacheConfig } from "./CacheMemoryPlugin";
export { MemoryCache } from "./CacheMemoryPlugin";
export { createCachePrewarmPlugin } from "./CachePrewarmPlugin";
export type { CachePrewarmConfig } from "./CachePrewarmPlugin";

// ---------- 网络与适配 ----------
export { createAdaptiveQualityPlugin } from "./AdaptiveQualityPlugin";
export type { AdaptiveQualityConfig } from "./AdaptiveQualityPlugin";
export { createAntiHotlinkPlugin } from "./AntiHotlinkPlugin";
export type { AntiHotlinkPluginConfig } from "./AntiHotlinkPlugin";
export { createAuthPlugin } from "./AuthPlugin";
export type { AuthPluginConfig } from "./AuthPlugin";
export { createCDNFallbackPlugin } from "./CDNFallbackPlugin";
export type { CDNFallbackConfig } from "./CDNFallbackPlugin";
export { createFallbackImagePlugin } from "./FallbackImagePlugin";
export type { FallbackImageConfig } from "./FallbackImagePlugin";
export { createImageOptimizationPlugin } from "./ImageOptimizationPlugin";
export type { ImageOptimizationPluginConfig } from "./ImageOptimizationPlugin";
export { createNetworkAnalyticsPlugin } from "./NetworkAnalyticsPlugin";
export type { NetworkAnalyticsPluginConfig } from "./NetworkAnalyticsPlugin";
export { createResponsivePlugin } from "./ResponsivePlugin";
export type { ResponsivePluginConfig } from "./ResponsivePlugin";
export { createRetryOnErrorPlugin } from "./RetryOnErrorPlugin";
export type { RetryOnErrorConfig } from "./RetryOnErrorPlugin";
export { createWebPPlugin } from "./WebPPlugin";
export type { WebPPluginConfig } from "./WebPPlugin";

// ---------- 视口与交互 ----------
export { createViewportAwarePlugin } from "./ViewportAwarePlugin";
export type { ViewportAwareConfig } from "./ViewportAwarePlugin";
export { createViewportDwellPlugin } from "./ViewportDwellPlugin";
export type { ViewportDwellConfig } from "./ViewportDwellPlugin";

// ---------- 可访问性与 SEO ----------
export { createA11yPlugin } from "./A11yPlugin";
export type { A11yPluginConfig } from "./A11yPlugin";
export { createAltTextPlugin } from "./AltTextPlugin";
export type { AltTextPluginConfig } from "./AltTextPlugin";
export { createSEOPlugin } from "./SEOPlugin";
export type { SEOPluginConfig } from "./SEOPlugin";

// ---------- 错误处理 ----------
export { createErrorBadgePlugin } from "./ErrorBadgePlugin";
export type { ErrorBadgeConfig } from "./ErrorBadgePlugin";
export { createErrorOverlayPlugin } from "./ErrorOverlayPlugin";
export type { ErrorOverlayConfig } from "./ErrorOverlayPlugin";
export { createErrorTrackingPlugin } from "./ErrorTrackingPlugin";
export type { ErrorTrackingConfig } from "./ErrorTrackingPlugin";

// ---------- 监控与可观测 ----------
export { createEventLoggerPlugin } from "./EventLoggerPlugin";
export type { EventLoggerConfig } from "./EventLoggerPlugin";
export { createPerformanceMonitorPlugin } from "./PerformanceMonitorPlugin";
export type { PerformanceMonitorConfig } from "./PerformanceMonitorPlugin";
export { createUserBehaviorPlugin } from "./UserBehaviorPlugin";
export type { UserBehaviorConfig } from "./UserBehaviorPlugin";
