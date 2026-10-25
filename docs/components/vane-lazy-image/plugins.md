# 图片懒加载 · 插件目录

<!-- AUTO-GENERATED:BEGIN
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [A11yPlugin](./A11yPlugin) | 无障碍支持：装饰性图片、自定义 aria-label、加载状态文本覆盖层。 | `enabled`<br/>`decorative`<br/>`ariaLabel`<br/>`statusText` | 2.0.0 | a11y, 可访问性 |
| [AdaptiveQualityPlugin](./AdaptiveQualityPlugin) | 网络自适应画质：按 effectiveType/saveData 调整质量参数，支持实时监听。 | `lowQ`<br/>`highQ`<br/>`saveDataQuality`<br/>`overrideEffectiveType`<br/>`overrideSaveData`<br/>`mode` = "once" | 2.0.0 | network, 网络 |
| [AltTextPlugin](./AltTextPlugin) | alt 自动生成：从 src 推导或按前缀生成 alt 文本。 | `derive`<br/>`prefix` | 2.0.0 | a11y, 可访问性 |
| [AntiHotlinkPlugin](./AntiHotlinkPlugin) | 防盗链：为 URL 追加签名 token，并限制允许的域名。 | `allowedDomains`<br/>`checkReferer` = false<br/>`generateToken`<br/>`tokenParam` = "token" | 2.0.0 | network, 网络 |
| [AspectRatioSpacerPlugin](./AspectRatioSpacerPlugin) | 宽高比占位：按 ratio 预留空间，避免加载造成的布局抖动（CLS）。 | `ratio` = 4 / 3 | 2.0.0 | visual, 视觉 |
| [AuthPlugin](./AuthPlugin) | 鉴权支持：为图片 URL 追加 token 参数并配置跨域/Referrer 策略。 | `token`<br/>`tokenParam`<br/>`crossOrigin`<br/>`referrerPolicy` | 2.0.0 | network, 网络 |
| [BadgePlugin](./BadgePlugin) | 角标徽章：按加载状态（loading/loaded/error）在四角或中心显示文字徽章。 | `text` = "Badge"<br/>`position` = "top-left"<br/>`bgColor` = "rgba(0,0,0,0.6)"<br/>`color` = "#fff"<br/>`fontSize` = 12<br/>`padding` = "2px 6px"<br/>`borderRadius` = 4<br/>`zIndex` = 3<br/>`showWhen` = "loaded"<br/>`enabled` = true | 2.0.0 | visual, 视觉 |
| [BatteryAwarePlugin](./BatteryAwarePlugin) | 低电量降级：电量低于阈值时缩小请求宽度并禁用预连接。 | `enabled` = true<br/>`lowBatteryThreshold` = 0.2<br/>`downgradeWidth` = 640<br/>`disablePreconnect` = true | 2.0.0 | loading, 加载策略 |
| [BlurUpPlugin](./BlurUpPlugin) | 模糊放大占位：加载期为图片注入 blur 滤镜，加载成功后过渡到清晰，避免「白屏 → 清晰图」的突兀切换。 | `startBlur` = 8<br/>`endBlur` = 0<br/>`durationMs` = 400 | 2.0.0 | visual, 视觉 |
| [BorderGlowPlugin](./BorderGlowPlugin) | 边框光晕：加载成功后为卡片应用发光阴影，悬停时增强。 | `color` = "rgba(0, 153, 255, 0.6)"<br/>`blurPx` = 12<br/>`spreadPx` = 2<br/>`hoverMultiplier` = 1.4 | 2.0.0 | visual, 视觉 |
| [CacheIDBPlugin](./CacheIDBPlugin) | IndexedDB 持久缓存：跨会话缓存图片 Blob/dataURL，支持 TTL。 | `enabled` = true<br/>`dbName` = "LLI-Cache"<br/>`storeName` = "images"<br/>`ttlMs` = 7 * 24 * 60 * 60 * 1000<br/>`debug` | 2.0.0 | cache, 缓存 |
| [CacheMemoryPlugin](./CacheMemoryPlugin) | 内存 LRU 缓存：会话内缓存图片数据，可配置容量与过期时间。 | `enabled` = true<br/>`maxEntries` = 200<br/>`ttlMs`<br/>`debug` = false | 2.0.0 | cache, 缓存 |
| [CachePrewarmPlugin](./CachePrewarmPlugin) | 缓存预热：进入视口或挂载时把图片预热到内存/IDB 缓存。 | `enabled` = true<br/>`trigger` = "enter"<br/>`preferMemory` = true<br/>`debug` = false | 2.0.0 | cache, 缓存 |
| [CaptionPlugin](./CaptionPlugin) | 图片说明文字覆盖层，支持样式定制。 | `text` = ""<br/>`position` = "bottom"<br/>`bg` = "rgba(0,0,0,0.55)"<br/>`color` = "#fff" | 2.0.0 | visual, 视觉 |
| [CDNFallbackPlugin](./CDNFallbackPlugin) | CDN 回退：主域名加载失败时按序切换备用 CDN 域名。 | `cdnBases` | 2.0.0 | network, 网络 |
| [ColorExtractionPlugin](./ColorExtractionPlugin) | 主色提取：canvas 采样图片主色，可设置容器背景或显示色卡。 | `setContainerBg` = true<br/>`sampleSize` = 4<br/>`showOverlay` = true | 2.0.0 | visual, 视觉 |
| [ComparisonPlugin](./ComparisonPlugin) | 对比标识覆盖层：标注图片处于对比模式（轻量占位实现）。 | `enabled` = true | 2.0.0 | visual, 视觉 |
| [ConcurrencyControlPlugin](./ConcurrencyControlPlugin) | 并发控制：限制同时加载数量，支持按域名分片与网络自适应。 | `maxConcurrent` = 4<br/>`scope` = "global"<br/>`adaptive` = true<br/>`acquireTimeoutMs` = 8000<br/>`debug` = false | 2.0.0 | loading, 加载策略 |
| [CropPlugin](./CropPlugin) | 焦点裁剪：通过 objectPosition 将裁剪焦点设在指定相对坐标。 | `enabled` = true<br/>`focusPoint` = { x: 0.5, y: 0.5 } | 2.0.0 | visual, 视觉 |
| [DataSaverPlugin](./DataSaverPlugin) | 省流模式：saveData 开启时降低质量参数并禁用预加载。 | `respectSaveData` = true<br/>`fallbackQuality` = 0.6<br/>`disablePreload` = true<br/>`qualityParam` = "quality" | 2.0.0 | loading, 加载策略 |
| [DecodeAfterIdlePlugin](./DecodeAfterIdlePlugin) | 空闲解码：加载成功后延迟到浏览器空闲再执行 img.decode()。 | `enabled` = true<br/>`timeoutMs` = 600 | 2.0.0 | loading, 加载策略 |
| [DominantColorPlugin](./DominantColorPlugin) | 主色占位：从 LQIP 采样平均色填充容器背景，减少白屏。 | `color`<br/>`lqipSrc` | 2.0.0 | visual, 视觉 |
| [ErrorBadgePlugin](./ErrorBadgePlugin) | 错误徽标：加载失败时在角落显示错误徽标。 | `text` = "Error"<br/>`position` = "top-right"<br/>`bgColor` = "rgba(220, 53, 69, 0.85)"<br/>`color` = "#fff"<br/>`fontSize` = 12<br/>`padding` = "2px 6px"<br/>`borderRadius` = 4<br/>`zIndex`<br/>`persistAfterFallback` = true | 2.0.0 | error, 错误处理 |
| [ErrorOverlayPlugin](./ErrorOverlayPlugin) | 错误覆盖层：加载失败时显示遮层与重试按钮。 | `message`<br/>`background`<br/>`color`<br/>`zIndex`<br/>`showRetry`<br/>`retryText`<br/>`persistAfterFallback` | 2.0.0 | error, 错误处理 |
| [ErrorTrackingPlugin](./ErrorTrackingPlugin) | 错误追踪：上报加载失败详情（端点或自定义函数），可显示徽标。 | `reportEndpoint`<br/>`report`<br/>`showBadge`<br/>`badgeText`<br/>`badgeColor`<br/>`badgeBg` | 2.0.0 | error, 错误处理 |
| [EventLoggerPlugin](./EventLoggerPlugin) | 事件日志：记录加载全生命周期事件（可加前缀过滤）。 | `enabled` = true<br/>`prefix` = "[LLI]" | 2.0.0 | monitor, 监控 |
| [ExifOrientationPlugin](./ExifOrientationPlugin) | EXIF 方向校正：按拍摄方向旋转图片，避免竖拍横显。 | `enabled` = true | 2.0.0 | loading, 加载策略 |
| [FadeInPlugin](./FadeInPlugin) | 加载完成后淡入显示，可自定义时长与缓动函数。 | `durationMs` = 400<br/>`easing` = "ease" | 2.0.0 | visual, 视觉 |
| [FallbackImagePlugin](./FallbackImagePlugin) | 回退图片：加载失败时切换到备用图片地址。 | `fallbackSrc` | 2.0.0 | network, 网络 |
| [FetchLoaderPlugin](./FetchLoaderPlugin) | fetch 流式加载器：将图片以 blob/objectURL 形式加载，支持进度上报（speed/ETA）、超时、指数退避重试、请求去重与 objectURL 自动回收。高优先级（domain priority 10），先于其他插件执行。 | `enabled` = true<br/>`cacheKeyFn`<br/>`maxCacheSize`<br/>`maxControllers`<br/>`maxObjectUrls`<br/>`timeout` = 30000<br/>`maxRetries` = 3<br/>`retryDelay` = 1000<br/>`retryBackoff` = 2 | 2.0.0 | loading, 加载策略 |
| [FilterPlugin](./FilterPlugin) | CSS 滤镜：灰度/复古/亮度/对比度/饱和度，悬停可恢复原图。 | `filter` = "none"<br/>`amount` = (type === "none" ? 1 : type === "brightness" ...<br/>`hover` | 2.0.0 | visual, 视觉 |
| [GalleryPlugin](./GalleryPlugin) | 画廊灯箱：图片上叠加打开按钮，进入灯箱或新窗口查看原图。 | `buttonText` = "Open"<br/>`enableLightbox` = true<br/>`overlayZIndex` = 10 | 2.0.0 | visual, 视觉 |
| [HoverPrefetchPlugin](./HoverPrefetchPlugin) | 悬停预取：鼠标悬停/触摸时预取下一张图片，支持去重。 | `getNextSrc`<br/>`target` = "container"<br/>`trigger` = "mouseenter"<br/>`as` = "image"<br/>`max` = 2<br/>`dedupe` = true<br/>`crossOrigin` = "anonymous"<br/>`debug` = false | 2.0.0 | loading, 加载策略 |
| [HoverZoomPlugin](./HoverZoomPlugin) | 悬停放大：鼠标悬停时放大显示图片局部。 | `scale` = 1.08<br/>`durationMs` = 180 | 2.0.0 | visual, 视觉 |
| [ImageOptimizationPlugin](./ImageOptimizationPlugin) | 图片优化：自动追加宽度/质量/格式查询参数。 | `enabled` = true<br/>`maxWidth` = 1920<br/>`quality` = 0.85<br/>`format` = "auto"<br/>`widthParam` = "w"<br/>`qualityParam` = "q"<br/>`formatParam` = "format" | 2.0.0 | network, 网络 |
| [LQIPPlugin](./LQIPPlugin) | 低清晰度占位图（LQIP）：加载期叠加模糊小图，支持自定义透明度与层级。 | `lqipSrc`<br/>`blur`<br/>`opacity`<br/>`zIndex` | 2.0.0 | visual, 视觉 |
| [MemoryPressureAbortPlugin](./MemoryPressureAbortPlugin) | 内存压力降级：设备内存不足或移动端时改请求低清图。 | `enabled` = true<br/>`deviceMemoryThreshold` = 4<br/>`preferOnMobile` = true<br/>`lowWidth` = 640 | 2.0.0 | loading, 加载策略 |
| [NetworkAnalyticsPlugin](./NetworkAnalyticsPlugin) | 网络分析：上报加载耗时、成功率与 CDN 分布。 | `reportEndpoint`<br/>`report`<br/>`trackCDN` | 2.0.0 | network, 网络 |
| [OfflinePlugin](./OfflinePlugin) | 离线支持：网络断开时显示离线提示覆盖层。 | `enabled` = true | 2.0.0 | loading, 加载策略 |
| [OverlayInfoPlugin](./OverlayInfoPlugin) | 信息覆盖层：显示自定义文本，支持常显或悬停触发。 | `content`<br/>`position`<br/>`background`<br/>`color`<br/>`fontSize`<br/>`padding`<br/>`borderRadius`<br/>`zIndex`<br/>`showWhen`<br/>`trigger` | 2.0.0 | visual, 视觉 |
| [ParallaxPlugin](./ParallaxPlugin) | 视差滚动：随页面滚动按强度偏移图片位置。 | `strength`<br/>`axis` | 2.0.0 | visual, 视觉 |
| [PerformanceMonitorPlugin](./PerformanceMonitorPlugin) | 性能监控：统计加载耗时并可选覆盖层实时展示。 | `showOverlay`<br/>`overlayPosition`<br/>`color`<br/>`background`<br/>`onReport` | 2.0.0 | monitor, 监控 |
| [PreconnectPlugin](./PreconnectPlugin) | DNS 预连接：提前与图片域名建立连接，可配置跨域。 | `domains`<br/>`crossOrigin` | 2.0.0 | loading, 加载策略 |
| [PredictiveLoadingPlugin](./PredictiveLoadingPlugin) | 预测性预加载：按启发式或自定义模型预加载后续图片。 | `model` = "heuristic"<br/>`predict`<br/>`maxPreload` = 5<br/>`as` = "image"<br/>`crossOrigin` = "anonymous" | 2.0.0 | loading, 加载策略 |
| [PriorityLoadingPlugin](./PriorityLoadingPlugin) | 优先级加载：按 high/medium/low 切换 eager/lazy 与 rootMargin。 | `priority` = "medium" | 2.0.0 | loading, 加载策略 |
| [ProgressOverlayPlugin](./ProgressOverlayPlugin) | 加载进度条覆盖层：百分比文本与 indeterminate 模式。 | `showWhen`<br/>`height`<br/>`color`<br/>`background`<br/>`showPercentText` | 2.0.0 | visual, 视觉 |
| [RedactionPlugin](./RedactionPlugin) | 隐私打码：在指定百分比区域叠加模糊或色块遮挡。 | `enabled` = true<br/>`boxes` = []<br/>`zIndex` = 3 | 2.0.0 | visual, 视觉 |
| [ResponsivePlugin](./ResponsivePlugin) | 响应式图片：注入 srcset/sizes 多宽度资源，可按宽度生成链接。 | `enabled` = true<br/>`variants` = [ { width: 400 }, { width: 800 }, { width: 12...<br/>`buildSrc` = defaultBuildSrc<br/>`sizes` = "(max-width: 800px) 100vw, 800px" | 2.0.0 | network, 网络 |
| [RetryOnErrorPlugin](./RetryOnErrorPlugin) | 失败重试：指数退避 + 可选抖动的自动重试。 | `maxRetries` = 2<br/>`baseDelayMs`<br/>`jitter` | 2.0.0 | network, 网络 |
| [ScrollIdlePlugin](./ScrollIdlePlugin) | 滚动空闲加载：滚动停止后再发起加载，避免与滚动争抢带宽。 | `idleMs` = 120<br/>`onlyWhenIntersecting` = true<br/>`maxWaitMs` = 1200<br/>`target` = "window"<br/>`axis` = "vertical"<br/>`debug` = false | 2.0.0 | loading, 加载策略 |
| [SEOPlugin](./SEOPlugin) | SEO 增强：alt/title 回退、固定 aspectRatio 减少 CLS、preload 与 LCP 优先。 | `enabled` = true<br/>`altFallback`<br/>`title`<br/>`aspectRatio`<br/>`priority` = "auto"<br/>`preload` = false | 2.0.0 | a11y, 可访问性 |
| [SkeletonPlugin](./SkeletonPlugin) | 骨架屏占位：加载期显示 shimmer/pulse 骨架动画。 | `type`<br/>`backgroundColor`<br/>`highlightColor`<br/>`borderRadius`<br/>`zIndex`<br/>`showWhen` | 2.0.0 | visual, 视觉 |
| [SvgPlaceholderPlugin](./SvgPlaceholderPlugin) | SVG 占位符覆盖层：支持静态或动态生成，加载成功后淡出。 | `svgContent`<br/>`background`<br/>`opacity`<br/>`zIndex`<br/>`showWhen`<br/>`fadeOutOnLoaded` | 2.0.0 | visual, 视觉 |
| [TransitionPlugin](./TransitionPlugin) | 加载成功过渡动画：从指定透明度/缩放到目标值的平滑过渡。 | `durationMs`<br/>`easing`<br/>`fromOpacity`<br/>`toOpacity`<br/>`fromScale`<br/>`toScale` | 2.0.0 | visual, 视觉 |
| [UserBehaviorPlugin](./UserBehaviorPlugin) | 用户行为采集：统计停留时长、点击与进出视口次数。 | `enabled` = true<br/>`onReport` | 2.0.0 | monitor, 监控 |
| [ViewportAwarePlugin](./ViewportAwarePlugin) | 视口状态可视化：显示进入/离开指示点并给 DOM 打标记。 | `showDot`<br/>`dotPosition`<br/>`hideWhenOut` | 2.0.0 | viewport, 视口 |
| [ViewportDebouncePlugin](./ViewportDebouncePlugin) | 视口防抖：对进出视口事件去抖，防止快速滚动反复触发。 | `debounceMs` = 150<br/>`onlyWhenIntersecting` = true<br/>`debug` = false | 2.0.0 | loading, 加载策略 |
| [ViewportDwellPlugin](./ViewportDwellPlugin) | 停留门槛：在视口内停留不足 dwellMs 则跳过加载，避免快速滚动浪费。 | `dwellMs` = 180<br/>`maxWaitMs` = 1000<br/>`onlyWhenIntersecting` = true<br/>`debug` = false | 2.0.0 | viewport, 视口 |
| [WatermarkPlugin](./WatermarkPlugin) | 文字水印覆盖层：支持四角/中心定位、动态文本与样式定制。 | `text` = "© 2024 Vane"<br/>`position` = "bottom-right"<br/>`opacity` = 0.8<br/>`fontSize` = 12<br/>`color` = "#fff"<br/>`offsetX` = 8<br/>`offsetY` = 8<br/>`zIndex` = 2<br/>`enabled` = true | 2.0.0 | visual, 视觉 |
| [WebPPlugin](./WebPPlugin) | WebP 优先：支持 WebP 的环境优先加载 .webp，失败自动回退原图。 | `enabled` = true<br/>`rewrite`<br/>`replaceExtensions` = ["jpg", "jpeg", "png"]<br/>`appendQueryParam`<br/>`onDomains`<br/>`testSupport` = true | 2.0.0 | network, 网络 |
<!-- AUTO-GENERATED:END -->

> 表格由各插件目录下的 `doc.json` 自动生成（`pnpm docs:plugins`），请勿手改 AUTO 区块。
> 引入方式：`import { createXxxPlugin } from "vane-lazy-image/custom-plugins/XxxPlugin"`（单插件子路径）；
> 确需全量时可用桶文件 `vane-lazy-image/custom-plugins`，但常规场景请按需引入。

## 分组总览（ADR-6：只分组，不淘汰）

60 个插件按 8 大领域分组（与上表 `标签` 列一致）。插件只增不减——未引入的插件会被 tree-shaking，不进消费方产物：

| 分组 | 数量 | 覆盖 |
| --- | --- | --- |
| `visual` 视觉 | 22 | 占位（BlurUp/LQIP/Skeleton/SvgPlaceholder）、过渡（FadeIn/Transition）、装饰（水印/角标/说明/光晕/视差）、裁剪与滤镜 |
| `loading` 加载策略 | 14 | 优先级、预取/预连接、并发控制、空闲解码、滚动空闲、省流/低电量/内存降级、离线、EXIF |
| `network` 网络与适配 | 10 | CDN 回退、重试、回退图、鉴权、防盗链、自适应画质、图片优化、WebP、响应式、网络分析 |
| `cache` 缓存 | 3 | 内存 LRU、IndexedDB 持久化、预热 |
| `a11y` 可访问性 | 3 | aria 无障碍、alt 生成、SEO |
| `error` 错误处理 | 3 | 错误覆盖层、错误徽标、错误上报 |
| `monitor` 监控分析 | 3 | 性能监控、事件日志、用户行为 |
| `viewport` 视口 | 2 | 视口状态可视化、停留门槛 |

> 不知道选谁？先看[组合配方](recipes.md)——5 个场景化配方覆盖常见组合。
