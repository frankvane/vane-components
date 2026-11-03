# 图片懒加载 · 插件目录

<!-- AUTO-GENERATED:BEGIN
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [A11yPlugin](#a11yplugin) | 无障碍支持：将装饰性图片设为 aria-hidden、自定义 aria-label、注入 role=img 与 aria-busy，并通过 aria-live 区域播报加载状态，提升读屏可用性。 | `enabled` = true<br/>`decorative` = false<br/>`ariaLabel` = undefined<br/>`statusText` = undefined | 2.0.0 | a11y, 可访问性, SEO |
| [AdaptiveQualityPlugin](#adaptivequalityplugin) | 自适应画质：根据网络类型（effectiveType）与省流模式（saveData）动态调整图片质量参数，弱网/省流自动降质，支持 realtime 实时监听。 | `lowQ` = 40(2g/3g)<br/>`highQ` = 80(4g)<br/>`saveDataQuality` = 35<br/>`overrideEffectiveType` = undefined<br/>`overrideSaveData` = undefined<br/>`mode` = "once" | 2.0.0 | other, 网络, 性能, 省流量 |
| [AltTextPlugin](#alttextplugin) | 替代文本：当图片未提供 alt 时，按前缀或自定义 derive 函数自动生成 alt，提升可访问性与 SEO；已有 alt 则不覆盖。 | `derive` = undefined<br/>`prefix` = "Image" | 2.0.0 | a11y, 可访问性, SEO |
| [AnimatedCursorPlugin](#animatedcursorplugin) | 自定义光标动画：为图片叠加系统光标（放大镜/十字/抓手等）或自定义光标（圆点/圆环/加号）+ 跟随动画 + 点击涟漪 + 文字提示，纯 CSS+JS 无依赖。 | `style` = "zoom-in"<br/>`enableFollower` = true<br/>`followerColor` = "rgba(59, 130, 246, 0.5)"<br/>`followerSize` = 40<br/>`followerDelay` = 0.1<br/>`scaleOnHover` = true<br/>`hoverScale` = 1.5<br/>`customIcon` = ""<br/>`cursorText` = ""<br/>`showRipple` = false | 2.0.0 | interaction, 视觉效果与交互, visual |
| [AntiHotlinkPlugin](#antihotlinkplugin) | 防盗链：为图片 URL 追加动态签名 token 或 referer 标记，配合域名白名单与 referer 校验，防止资源被第三方直链盗用。 | `allowedDomains`<br/>`checkReferer` = false<br/>`generateToken`<br/>`tokenParam` = "token" | 2.0.0 | network, 网络, 防盗链, 签名 |
| [AspectRatioSpacerPlugin](#aspectratiospacerplugin) | 宽高比占位：在容器上预留固定宽高比，图片加载前后保持布局稳定，杜绝 CLS（布局抖动）。 | `ratio` = 4/3 | 2.0.0 | a11y, 可访问性, 视觉 |
| [AuthPlugin](#authplugin) | 鉴权：为私有图片 URL 追加访问凭证 token（查询参数），并可配置 crossOrigin 与 referrerPolicy，满足需登录态才能访问的图片源鉴权需求。 | `token`<br/>`tokenParam`<br/>`crossOrigin`<br/>`referrerPolicy` | 2.0.0 | network, 网络, 鉴权, 私有资源 |
| [BadgePlugin](#badgeplugin) | 角标徽章：在图片四角或中心叠加文字徽章，可按加载状态（always/loading/loaded/error）显示，支持自定义文字、颜色、字号与形状。 | `text` = "Badge"<br/>`position` = "top-left"<br/>`bgColor` = "rgba(0,0,0,0.6)"<br/>`color` = "#fff"<br/>`fontSize` = 12<br/>`padding` = "2px 6px"<br/>`borderRadius` = 4<br/>`zIndex` = 3<br/>`showWhen` = "loaded"<br/>`enabled` = true | 2.0.0 | other, 视觉, 徽标 |
| [BatteryAwarePlugin](#batteryawareplugin) | 电量感知：当设备电量低于阈值或开启省流模式时，自动将图片请求宽度降级并禁用预连接，兼顾体验与续航/流量。 | `enabled` = true<br/>`lowBatteryThreshold` = 0.2<br/>`downgradeWidth` = 640<br/>`disablePreconnect` = true | 2.0.0 | other, 加载策略, 性能, 省流量 |
| [BlurUpPlugin](#blurupplugin) | 模糊放大占位：加载期为图片注入 blur 滤镜，加载成功后过渡到清晰，避免「白屏 → 清晰图」的突兀切换。 | `startBlur` = 8<br/>`endBlur` = 0<br/>`durationMs` = 400 | 2.0.0 | visual, 视觉 |
| [BorderGlowPlugin](#borderglowplugin) | 边框光晕：加载成功后为卡片应用发光阴影，悬停时增强。 | `color` = rgba(0, 153, 255, 0.6)<br/>`blurPx` = 12<br/>`spreadPx` = 2<br/>`hoverMultiplier` = 1.4 | 2.0.0 | visual, 视觉 |
| [CacheIDBPlugin](#cacheidbplugin) | IndexedDB 持久缓存：跨会话缓存图片 Blob/dataURL，支持 TTL。 | `enabled` = true<br/>`dbName` = "LLI-Cache"<br/>`storeName` = "images"<br/>`ttlMs` = 604800000<br/>`debug` | 2.0.0 | cache, 缓存 |
| [CacheMemoryPlugin](#cachememoryplugin) | 内存 LRU 缓存：会话内缓存图片数据，可配置容量与过期时间。 | `enabled` = true<br/>`maxEntries` = 200<br/>`ttlMs`<br/>`debug` = false | 2.0.0 | cache, 缓存 |
| [CachePrewarmPlugin](#cacheprewarmplugin) | 缓存预热：进入视口或挂载时把图片预热到内存/IDB 缓存。 | `enabled` = true<br/>`trigger` = "enter"<br/>`preferMemory` = true<br/>`debug` = false<br/>`showBadge` = false | 2.0.0 | cache, 缓存 |
| [CaptionPlugin](#captionplugin) | 图片说明文字覆盖层，支持样式定制。 | `text` = ""<br/>`position` = "bottom"<br/>`bg` = rgba(0,0,0,0.62)<br/>`color` = #fff | 2.0.0 | visual, 视觉 |
| [CarouselPlugin](#carouselplugin) | 自动轮播（gallery 增强插件）：在工具条渲染 播放/暂停 按钮，按 interval 循环切换主图；悬停图集根容器可暂停。 | `interval` = 3000<br/>`autoStart` = false<br/>`pauseOnHover` = true | 2.1.0 | gallery, 图集, 轮播, 自动播放 |
| [CDNFallbackPlugin](#cdnfallbackplugin) | CDN 回退：主 CDN 域名加载失败时，按序切换备用 CDN 域名（保留路径与查询参数），实现跨厂商容灾，避免单点故障导致破图。 | `cdnBases` | 2.0.0 | network, 网络, CDN, 容灾 |
| [ColorExtractionPlugin](#colorextractionplugin) | 主色提取：canvas 采样图片主色，可设置容器背景或显示色卡。 | `setContainerBg` = true<br/>`sampleSize` = 4<br/>`showOverlay` = true | 2.0.0 | visual, 视觉 |
| [ColorSwatchPlugin](#colorswatchplugin) | 颜色选择器：自动提取商品图片主要颜色，支持交互选择、颜色代码显示与悬停放大。 | `maxColors` = 5<br/>`showPalette` = true<br/>`position` = "bottom"<br/>`swatchSize` = 32<br/>`interactive` = true<br/>`showColorCode` = false<br/>`gap` = 8<br/>`onColorSelect` = undefined<br/>`style` = {} | 2.0.0 | ecommerce, 电商核心 |
| [ComparisonPlugin](#comparisonplugin) | 前后对比（v2 真实实现）：用可拖拽分隔条对比 beforeSrc / afterSrc 两张图，拖动实时比较差异（如调色前后、装修前后、A/B 图）。不再是写死文字角标。 | `beforeSrc` = 主图 src<br/>`afterSrc` = 主图 src<br/>`labelBefore` = 前<br/>`labelAfter` = 后<br/>`start` = 0.5 | 2.0.0 | other, 视觉, 对比, 交互 |
| [ConcurrencyControlPlugin](#concurrencycontrolplugin) | 并发控制：限制同时加载数量，支持按域名分片与网络自适应。 | `maxConcurrent` = 4<br/>`scope` = "global"<br/>`adaptive` = true<br/>`acquireTimeoutMs` = 8000<br/>`debug` = false | 2.0.0 | loading, 加载策略 |
| [CounterPlugin](#counterplugin) | 图片计数指示器（gallery 增强插件）：在工具条渲染「当前 / 总数」，绑定 activeIndex。 | `prefix`<br/>`separator` =  /  | 2.1.0 | gallery, 图集, 计数, 指示器 |
| [CropPlugin](#cropplugin) | 焦点裁剪：通过 object-fit: cover 与 object-position 将裁剪焦点设在指定相对坐标，统一多图主体构图。 | `enabled` = true<br/>`focusPoint` = { x: 0.5, y: 0.5 }<br/>`showLabel` = true | 2.0.0 | other, 视觉, 裁剪 |
| [CustomEffectsPlugin](#customeffectsplugin) | 自定义效果逃逸舱：把内置视觉插件覆盖不到的任意 CSS 效果（filter / transform / transition / className）直接注入图片与容器，无需新造组件。旧版 CustomEffects 展示页的 v2 等效形态。 | `imageStyle` = {}<br/>`imageClassName` = ""<br/>`containerStyle` = {}<br/>`containerClassName` = ""<br/>`hoverImageStyle` = {} | 2.0.0 | visual, 视觉, 自定义 |
| [DataSaverPlugin](#datasaverplugin) | 省流模式：saveData 开启时降低质量参数并禁用预加载。 | `respectSaveData` = true<br/>`fallbackQuality` = 0.6<br/>`disablePreload` = true<br/>`qualityParam` = "quality" | 2.0.0 | loading, 加载策略 |
| [DecodeAfterIdlePlugin](#decodeafteridleplugin) | 空闲解码：图片加载成功后延迟到浏览器空闲时段再执行 img.decode()，避免大图解码阻塞主线程，提升交互流畅度。 | `enabled` = true<br/>`timeoutMs` = 600 | 2.0.0 | loading, 加载策略, 解码, 性能 |
| [DepthMapPlugin](#depthmapplugin) | 3D 视差深度效果：鼠标跟随的倾斜 / 视差 / 浮动 / 3D 旋转，带光泽与阴影，纯 CSS transforms 无依赖。 | `style` = "tilt"<br/>`intensity` = 0.5<br/>`maxTilt` = 20<br/>`enablePerspective` = true<br/>`perspective` = 1000<br/>`enableGlare` = true<br/>`glareColor` = "rgba(255, 255, 255, 0.3)"<br/>`glareOpacity` = 0.5<br/>`enableShadow` = true<br/>`transitionDuration` = 300<br/>`resetOnLeave` = true | 2.0.0 | interaction, 视觉效果与交互, visual |
| [DominantColorPlugin](#dominantcolorplugin) | 主色占位：在加载完成前用指定颜色或 LQIP 采样平均色填充容器背景，减少白屏、提升视觉连贯性。 | `color` = rgba(0,0,0,0.06)<br/>`lqipSrc` = undefined | 2.0.0 | other, 视觉, 占位 |
| [DownloadButtonPlugin](#downloadbuttonplugin) | 下载按钮：为图片添加一键下载功能，支持多位置、自定义样式、悬停显示与生命周期回调。 | `filename` = undefined<br/>`position` = "top-right"<br/>`size` = "medium"<br/>`buttonStyle` = {}<br/>`showOnHover` = false<br/>`onBeforeDownload` = undefined<br/>`onDownloadSuccess` = undefined<br/>`onDownloadError` = undefined<br/>`customIcon` = undefined<br/>`tooltipText` = "下载图片" | 2.0.0 | ecommerce, 电商核心 |
| [ErrorBadgePlugin](#errorbadgeplugin) | 错误徽标：图片加载失败（或回退成功后）在指定角落显示错误徽标，便于在大批量图片列表中快速定位失败项。 | `text` = "Error"<br/>`position` = "top-right"<br/>`bgColor` = "rgba(220, 53, 69, 0.85)"<br/>`color` = "#fff"<br/>`fontSize` = 12<br/>`padding` = "2px 6px"<br/>`borderRadius` = 4<br/>`zIndex` = 100<br/>`persistAfterFallback` = true | 2.0.0 | error, 错误处理, 错误反馈 |
| [ErrorOverlayPlugin](#erroroverlayplugin) | 错误覆盖层：图片加载失败时显示半透明遮罩与可选『重试』按钮，引导用户手动重试，适用于商品主图等关键图。 | `message` = undefined（回退『加载失败』）<br/>`background` = "rgba(220, 53, 69, 0.18)"<br/>`color` = "#b00020"<br/>`zIndex` = 10<br/>`showRetry` = true<br/>`retryText` = "重试"<br/>`persistAfterFallback` = true | 2.0.0 | error, 错误处理, 错误反馈, 重试 |
| [ErrorTrackingPlugin](#errortrackingplugin) | 错误追踪：在图片加载失败时上报失败详情（地址 / 错误信息 / 网络 / 设备 / 次数）到自定义函数或上报端点，并可显示错误计数角标，用于生产环境图片错误监控。 | `reportEndpoint`<br/>`report`<br/>`showBadge` = false<br/>`badgeText` = "Error"<br/>`badgeColor` = "#fff"<br/>`badgeBg` = "rgba(220,53,69,0.8)" | 2.0.0 | error, 错误处理, 监控, 可观测 |
| [EventLoggerPlugin](#eventloggerplugin) | 事件日志：在控制台记录图片加载全生命周期事件（before-load / load-success / load-error / enter-viewport / leave-viewport / progress），便于调试与监控。 | `enabled` = true<br/>`prefix` = "[LLI]" | 2.0.0 | other, 监控, 调试 |
| [ExifOrientationPlugin](#exiforientationplugin) | EXIF 方向：根据图片自带的方向信息（EXIF Orientation）自动校正显示，避免手机竖拍照片横显。 | `enabled` = true | 2.0.0 | a11y, 可访问性, 加载策略 |
| [FadeInPlugin](#fadeinplugin) | 加载完成后淡入显示，可自定义时长与缓动函数。 | `durationMs` = 400<br/>`easing` = ease | 2.0.0 | visual, 视觉 |
| [FallbackImagePlugin](#fallbackimageplugin) | 兜底图：图片加载失败时自动切换到备用图片地址，避免出现破图空白，是最基础的失败降级手段。 | `fallbackSrc` | 2.0.0 | network, 网络, 兜底, 降级 |
| [FavoritePlugin](#favoriteplugin) | 收藏切换（gallery 增强插件）：在工具条渲染心形按钮，绑定 context.favorited 协调态，点击切换并回调 onChange。 | `onChange` = -<br/>`activeColor` = #ff5a5f | 2.1.0 | gallery, 图集, 收藏, 喜欢 |
| [FetchLoaderPlugin](#fetchloaderplugin) | fetch 流式加载器：将图片以 blob/objectURL 形式加载，支持进度上报（speed/ETA）、超时、指数退避重试、请求去重与 objectURL 自动回收。高优先级（domain priority 10），先于其他插件执行。 | `enabled` = true<br/>`cacheKeyFn`<br/>`maxCacheSize`<br/>`maxControllers`<br/>`maxObjectUrls`<br/>`timeout` = 30000<br/>`maxRetries` = 3<br/>`retryDelay` = 1000<br/>`retryBackoff` = 2 | 2.0.0 | loading, 加载策略 |
| [FilterPlugin](#filterplugin) | CSS 滤镜：灰度/复古/亮度/对比度/饱和度，悬停可恢复原图。 | `filter` = "none"<br/>`amount` = undefined<br/>`hover` = false | 2.0.0 | visual, 视觉 |
| [FullscreenPlugin](#fullscreenplugin) | 全屏切换（gallery 增强插件）：在工具条渲染 全屏/退出 按钮，对图集根容器调用 requestFullscreen。 | `enterLabel` = ⛶ 全屏<br/>`exitLabel` = ✕ 退出 | 2.1.0 | gallery, 图集, 全屏, 沉浸式 |
| [GalleryPlugin](#galleryplugin) | 画廊灯箱：图片上叠加打开按钮，进入灯箱或新窗口查看原图。 | `buttonText` = "Open"<br/>`enableLightbox` = true<br/>`overlayZIndex` = 10<br/>`buttonStyle` = {} | 2.0.0 | visual, 视觉 |
| [GlitchEffectPlugin](#glitcheffectplugin) | 故障艺术效果：赛博朋克风格 RGB 分离 / 扫描线 / 数字失真 / 混合 / 强烈五种风格，纯 CSS 无依赖，支持持续、一次性、悬停触发。 | `style` = "glitch-mix"<br/>`continuous` = false<br/>`duration` = 1000<br/>`intensity` = 0.7<br/>`triggerOnHover` = false<br/>`rgbOffset` = 3<br/>`scanLineCount` = 30<br/>`animateScanLines` = true | 2.0.0 | interaction, 视觉效果与交互, visual |
| [HotspotPlugin](#hotspotplugin) | 主图热点标注（gallery 增强插件）：在 galleryOverlay 按百分比定位可交互热点，点击弹出标签气泡（含可选链接）。 | `hotspots` = [] | 2.1.0 | gallery, 图集, 热点, 标注 |
| [HoverPrefetchPlugin](#hoverprefetchplugin) | 悬停预取：当用户将鼠标悬停（或触摸）在图片上时，提前向浏览器插入 preload 链接拉取下一张资源，实现零延迟切换。 | `getNextSrc` = undefined<br/>`target` = "container"<br/>`trigger` = "mouseenter"<br/>`as` = "image"<br/>`max` = 2<br/>`dedupe` = true<br/>`crossOrigin` = "anonymous"<br/>`showBadge` = false<br/>`debug` = false | 2.0.0 | viewport, 视口与交互, 预取, 性能 |
| [HoverZoomPlugin](#hoverzoomplugin) | 悬停放大：鼠标悬停时放大显示图片局部。 | `scale` = 1.08<br/>`durationMs` = 180 | 2.0.0 | visual, 视觉 |
| [ImageOptimizationPlugin](#imageoptimizationplugin) | 图片优化：自动追加宽度/质量/格式查询参数。 | `enabled` = true<br/>`maxWidth` = 1920<br/>`quality` = 0.85<br/>`format` = "auto"<br/>`widthParam` = "w"<br/>`qualityParam` = "q"<br/>`formatParam` = "format" | 2.0.0 | network, 网络 |
| [IndicatorPlugin](#indicatorplugin) | 圆点指示器（gallery 增强插件）：在工具条渲染圆点，点击第 N 点跳转到对应主图。 | `size` = 8<br/>`gap` = 6<br/>`activeColor` = #2b7de9<br/>`idleColor` = rgba(0,0,0,0.25) | 2.1.0 | gallery, 图集, 指示点, 进度 |
| [InventoryStatusPlugin](#inventorystatusplugin) | 库存状态：实时显示商品库存状态（有货/低库存/缺货/预订），支持自动刷新和低库存预警。 | `status` = "in-stock"<br/>`stockCount` = undefined<br/>`lowStockThreshold` = 10<br/>`showBadge` = true<br/>`autoRefresh` = false<br/>`refreshInterval` = 30000<br/>`fetchStock` = undefined<br/>`onStatusChange` = undefined<br/>`position` = "top-right"<br/>`style` = {} | 2.0.0 | ecommerce, 电商核心 |
| [LocalizationPlugin](#localizationplugin) | 国际化：根据用户语言环境自动切换图片，支持手动指定、自动检测、自定义检测函数与后备图片。 | `localeMap` = undefined<br/>`defaultLocale` = "en"<br/>`currentLocale` = undefined<br/>`autoDetect` = true<br/>`detectLocale` = undefined<br/>`fallbackSrc` = undefined | 2.0.0 | ecommerce, 电商核心 |
| [LQIPPlugin](#lqipplugin) | 低清预览（LQIP）：在清晰图加载期间叠加模糊的小图作为占位，加载完成后自动隐藏，实现渐进式加载体验。 | `lqipSrc` = undefined<br/>`blur` = 12<br/>`opacity` = 1<br/>`zIndex` = 2 | 2.0.0 | other, 视觉, 占位, 渐进加载 |
| [MemoryPressureAbortPlugin](#memorypressureabortplugin) | 内存压力降级 + 离开中止（v2 真实实现）：低内存 / 移动端 / 省流时把图片重写为低清版本；离开视口且仍在加载时，调用 context.reset() 真正取消在途元素加载，回收内存。 | `enabled` = true<br/>`deviceMemoryThreshold` = 4<br/>`preferOnMobile` = true<br/>`lowWidth` = 640<br/>`abortOnLeave` = true | 2.0.0 | loading, 加载策略, 降质, 中止, 低端设备 |
| [MorphPlugin](#morphplugin) | 形变过渡效果：圆角/缩放/旋转/倾斜/弹性/液态等多种形变动画，纯 CSS transforms，支持加载触发、悬停触发与持续动画。 | `type` = "elastic"<br/>`duration` = 800<br/>`delay` = 0<br/>`easing` = "cubic-bezier(0.68, -0.55, 0.265, 1.55)"<br/>`triggerOnHover` = false<br/>`continuous` = false<br/>`fromBorderRadius` = "50%"<br/>`toBorderRadius` = "0%"<br/>`fromScale` = 1<br/>`toScale` = 1<br/>`fromRotate` = 0<br/>`toRotate` = 0<br/>`fromSkew` = 0<br/>`toSkew` = 0 | 2.0.0 | interaction, 视觉效果与交互, visual |
| [NetworkAnalyticsPlugin](#networkanalyticsplugin) | 网络分析：上报加载耗时、成功率与 CDN 分布。 | `reportEndpoint`<br/>`report`<br/>`trackCDN` | 2.0.0 | network, 网络 |
| [OfflinePlugin](#offlineplugin) | 离线降级（v2 真实实现）：在线时把资源预热进 Cache Storage；离线时优先从缓存取同域资源，否则回退 offlineSrc / 内置 SVG 占位图，并在离线时显示状态徽标。不再是纯提示层。 | `offlineSrc` = 内置 SVG 离线占位图（data URI）<br/>`cacheName` = vane-lazy-image-offline<br/>`warm` = true<br/>`showBadge` = true | 2.0.0 | loading, 加载策略, 离线, 省流 |
| [OverlayInfoPlugin](#overlayinfoplugin) | 信息覆盖层：显示自定义文本，支持常显或悬停触发。 | `content` = ""<br/>`position` = "bottom"<br/>`background` = rgba(0,0,0,0.62)<br/>`color` = #fff<br/>`fontSize` = 12<br/>`padding` = 6px 10px<br/>`borderRadius` = 0<br/>`zIndex` = 2<br/>`showWhen` = "always"<br/>`trigger` = "always" | 2.0.0 | visual, 视觉 |
| [ParallaxPlugin](#parallaxplugin) | 视差滚动：随页面滚动按强度偏移图片位置。 | `strength` = 0.2<br/>`axis` = "y" | 2.0.0 | visual, 视觉 |
| [PerformanceMonitorPlugin](#performancemonitorplugin) | 性能监控：统计单张图片的加载耗时，可选在四角叠加实时展示耗时面板，并在加载完成时通过 onReport 上报。 | `showOverlay` = true<br/>`overlayPosition` = "top-right"<br/>`color` = "#fff"<br/>`background` = "rgba(0,0,0,0.45)"<br/>`onReport` = undefined | 2.0.0 | other, 监控, 性能 |
| [PreconnectPlugin](#preconnectplugin) | DNS 预连接：提前与图片域名建立连接，可配置跨域。 | `domains`<br/>`crossOrigin`<br/>`showBadge` = false | 2.0.0 | loading, 加载策略 |
| [PredictiveLoadingPlugin](#predictiveloadingplugin) | 预测性预加载（v2 真实实现）：未提供 predict 时，内置启发式按 URL 末尾数字段递增/递减派生「下一张」并注入 &lt;link rel="preload"&gt; 预取；也可传入 predict 自定义预测目标。 | `model` = "heuristic"<br/>`strategy` = "increment"<br/>`predict` = 未设置（用内置启发式）<br/>`maxPreload` = 3<br/>`as` = "image"<br/>`crossOrigin` = "anonymous" | 2.0.0 | loading, 加载策略, 预取 |
| [PriceTagPlugin](#pricetagplugin) | 商品价格标签：在图片上叠加价格信息，支持原价、折扣、节省金额、异步价格获取与淡入动画。 | `price` = undefined<br/>`currency` = "$"<br/>`position` = "top-right"<br/>`originalPrice` = undefined<br/>`discount` = undefined<br/>`showSavings` = false<br/>`backgroundColor` = "#c62828"<br/>`textColor` = "#fff"<br/>`animate` = true<br/>`style` = {}<br/>`fetchPrice` = undefined<br/>`loadingText` = "加载中..."<br/>`errorText` = "价格获取失败" | 2.0.0 | ecommerce, 电商核心 |
| [PriorityLoadingPlugin](#priorityloadingplugin) | 优先级加载：按 high/medium/low 切换 eager/lazy 与 rootMargin。 | `priority` = "medium" | 2.0.0 | loading, 加载策略 |
| [ProgressOverlayPlugin](#progressoverlayplugin) | 加载进度条覆盖层：百分比文本与 indeterminate 模式。 | `showWhen` = "loading"<br/>`height` = 3<br/>`color` = #4a90e2<br/>`background` = transparent<br/>`showPercentText` = false | 2.0.0 | visual, 视觉 |
| [PromoBadgePlugin](#promobadgeplugin) | 促销角标：在商品图片上显示 NEW/HOT/SALE 等促销标签，支持脉冲动画和丝带样式，可叠加多个。 | `type` = "hot"<br/>`text` = undefined<br/>`position` = "top-left"<br/>`backgroundColor` = undefined<br/>`color` = undefined<br/>`animate` = true<br/>`pulse` = false<br/>`ribbon` = false<br/>`style` = {} | 2.0.0 | ecommerce, 电商核心 |
| [RedactionPlugin](#redactionplugin) | 隐私打码：在指定百分比区域叠加模糊或色块遮挡。 | `enabled` = true<br/>`boxes` = []<br/>`zIndex` = 3 | 2.0.0 | visual, 视觉 |
| [ResponsivePlugin](#responsiveplugin) | 响应式图片：注入 srcset/sizes 多宽度资源，浏览器按视口选择最佳尺寸，兼顾清晰度与流量。 | `enabled` = true<br/>`variants` = [{400},{800},{1200}]<br/>`buildSrc` = defaultBuildSrc（追加 ?w=）<br/>`sizes` = "(max-width: 800px) 100vw, 800px" | 2.0.0 | a11y, 可访问性, 网络, 响应式 |
| [RetryOnErrorPlugin](#retryonerrorplugin) | 失败重试：图片加载失败后按指数退避（可选抖动）自动重试，提升网络抖动 / 瞬时故障下的自愈成功率，并提供重试进度角标。 | `maxRetries` = 2<br/>`baseDelayMs`<br/>`jitter` | 2.0.0 | network, 网络, 重试, 自愈 |
| [RevealAnimationPlugin](#revealanimationplugin) | 图片揭示动画：为图片加载添加各种进场动画（淡入/缩放/旋转/翻转/弹跳/弹性等 16 种预设 + 自定义），纯 CSS 无依赖。 | `animation` = "fade-up"<br/>`duration` = 600<br/>`delay` = 0<br/>`easing` = "ease-out"<br/>`customAnimation` = ""<br/>`customKeyframes` = ""<br/>`fillMode` = "both"<br/>`disabled` = false | 2.0.0 | interaction, 视觉效果与交互, visual |
| [ScrollIdlePlugin](#scrollidleplugin) | 滚动空闲加载：滚动停止后再发起加载，避免与滚动争抢带宽。 | `idleMs` = 120<br/>`onlyWhenIntersecting` = true<br/>`maxWaitMs` = 1200<br/>`target` = "window"<br/>`axis` = "vertical"<br/>`debug` = false | 2.0.0 | loading, 加载策略 |
| [SEOPlugin](#seoplugin) | SEO 增强：alt/title 回退、固定容器宽高比减少 CLS、将首屏关键图设为 LCP 优先（eager + preload），提升搜索排名与加载体验。 | `enabled` = true<br/>`altFallback` = undefined<br/>`title` = undefined<br/>`aspectRatio` = undefined<br/>`priority` = "auto"<br/>`preload` = false | 2.0.0 | a11y, 可访问性, SEO |
| [SkeletonPlugin](#skeletonplugin) | 骨架屏占位：加载期显示 shimmer/pulse 骨架动画。 | `type` = "shimmer"<br/>`backgroundColor` = #e5e7eb<br/>`highlightColor` = #f3f4f6<br/>`borderRadius` = 6<br/>`zIndex` = 1<br/>`showWhen` = "loading" | 2.0.0 | visual, 视觉 |
| [SocialSharePlugin](#socialshareplugin) | 社交分享：在商品图片上显示社交分享按钮，支持 6 大平台、悬停展开、自定义尺寸与分享回调。 | `platforms` = ["facebook","twitter","pinterest"]<br/>`position` = "top-right"<br/>`showOnHover` = false<br/>`title` = "分享图片"<br/>`description` = ""<br/>`ogImage` = undefined<br/>`size` = "medium"<br/>`onShare` = undefined<br/>`style` = {} | 2.0.0 | ecommerce, 电商核心 |
| [Spin360Plugin](#spin360plugin) | 360° 环物旋转（gallery 核心插件）：把 images 当逐帧序列，拖拽或自动播放切换帧，覆盖主图显示。 | `sensitivity` = 6<br/>`autoPlay` = false<br/>`autoPlayInterval` = 120 | 2.1.0 | gallery, 图集, 360, 环物, 旋转 |
| [SvgPlaceholderPlugin](#svgplaceholderplugin) | SVG 占位：在加载期间注入自定义 SVG 占位内容（如骨架、品牌图形），加载成功后淡出，增强加载反馈与品牌感。 | `svgContent` = undefined<br/>`background` = "transparent"<br/>`opacity` = 1<br/>`zIndex` = 3<br/>`showWhen` = "loading"<br/>`fadeOutOnLoaded` = true | 2.0.0 | other, 视觉, 占位 |
| [ThumbPreloadPlugin](#thumbpreloadplugin) | 相邻图预加载（gallery 增强插件）：监听主图切换事件，预加载后续若干张到浏览器缓存，使切换近乎瞬时。 | `lookahead` = 1<br/>`alsoPrevious` = false | 2.1.0 | gallery, 图集, 预加载, 性能 |
| [ThumbSyncPlugin](#thumbsyncplugin) | 缩略图联动（gallery 核心插件）：渲染缩略图条，点击缩略图切换主图，选中态描边高亮。 | `gap` = 8<br/>`thumbWidth` = 64<br/>`thumbHeight` = 64<br/>`showActiveRing` = true<br/>`radius` = 6 | 2.1.0 | gallery, 图集, 缩略, 联动 |
| [TransitionPlugin](#transitionplugin) | 加载成功过渡动画：从指定透明度/缩放到目标值的平滑过渡。 | `durationMs` = 400<br/>`easing` = ease<br/>`fromOpacity` = 0<br/>`toOpacity` = 1<br/>`fromScale` = 1<br/>`toScale` = 1 | 2.0.0 | visual, 视觉 |
| [UserBehaviorPlugin](#userbehaviorplugin) | 用户行为：实时统计每张图片的视口驻留时长、点击次数、进入/离开次数，并在图片上叠加可视化面板，卸载时统一上报。 | `enabled` = true<br/>`onReport` = undefined<br/>`showOverlay` = true | 2.0.0 | viewport, 视口与交互, 数据, 分析 |
| [VideoPosterPlugin](#videoposterplugin) | 视频海报：将图片作为视频封面，点击播放视频（模态框或内联），支持自动播放、循环、静音与自定义按钮。 | `videoUrl` = undefined<br/>`autoPlay` = true<br/>`loop` = false<br/>`muted` = true<br/>`playButtonPosition` = "center"<br/>`playButtonSize` = "large"<br/>`playButtonStyle` = {}<br/>`showPlayButton` = true<br/>`playInModal` = true<br/>`playIcon` = undefined<br/>`onPlay` = undefined | 2.0.0 | ecommerce, 电商核心 |
| [ViewportAwarePlugin](#viewportawareplugin) | 视口感知加载：真正把 IntersectionObserver 的 rootMargin / threshold / once 下发给核心，控制图片「提前多少距离 / 多灵敏」才触发加载，并在四角显示绿/灰指示点辅助观察。 | `rootMargin` = 未设置（沿用 Core 默认 0px）<br/>`threshold` = 未设置<br/>`once` = true<br/>`unobserveOnVisible` = 由 once 推导<br/>`showDot` = false<br/>`dotPosition` = "bottom-right"<br/>`hideWhenOut` = false | 2.0.0 | viewport, 视口与交互, 懒加载 |
| [ViewportDebouncePlugin](#viewportdebounceplugin) | 视口防抖（v2 真实实现）：进入视口后并不立即加载，而是等待元素「稳定停留 debounceMs」才放行；若期间离开视口且未达 maxWaitMs 上限，则中止本次加载，真正避免快速滚动时误加载/重复加载。 | `debounceMs` = 200<br/>`maxWaitMs` = 1200<br/>`onlyWhenIntersecting` = true<br/>`debug` = false | 2.0.0 | viewport, 视口与交互, 防抖 |
| [ViewportDwellPlugin](#viewportdwellplugin) | 视口驻留门控（v2 真实实现）：在真正加载前要求图片在视口内持续停留 dwellMs，快速划过（停留不足且离开）则中止加载；超过 maxWaitMs 后放行以防饥饿。 | `dwellMs` = 250<br/>`maxWaitMs` = 1500<br/>`onlyWhenIntersecting` = true<br/>`debug` = false | 2.0.0 | viewport, 视口与交互, 驻留, 省流量 |
| [WatermarkPlugin](#watermarkplugin) | 文字水印覆盖层：支持四角/中心定位、动态文本与样式定制。 | `text` = "© 2024 Vane"<br/>`position` = "bottom-right"<br/>`opacity` = 0.8<br/>`fontSize` = 12<br/>`color` = "#fff"<br/>`offsetX` = 8<br/>`offsetY` = 8<br/>`zIndex` = 2<br/>`enabled` = true | 2.0.0 | visual, 视觉 |
| [WebPPlugin](#webpplugin) | WebP 优先：在支持 WebP 的环境中自动将图片重写为 .webp（或自定义链接），失败时回退原图，体积更小加载更快。 | `enabled` = true<br/>`rewrite` = undefined<br/>`replaceExtensions` = ["jpg", "jpeg", "png"]<br/>`appendQueryParam` = undefined<br/>`onDomains` = []（不限制）<br/>`testSupport` = true | 2.0.0 | other, 网络, 性能, WebP |
| [ZoomControlPlugin](#zoomcontrolplugin) | 按钮式缩放控制（gallery 增强插件）：在工具条渲染 − / 重置 / + 按钮，调整 context.zoom，GalleryCore 对主图施加 scale 变换。 | `step` = 0.5<br/>`min` = 1<br/>`max` = 4 | 2.1.0 | gallery, 图集, 缩放, 放大 |

## 插件能力明细

### A11yPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用无障碍增强 |
| `decorative` | `boolean` | `false` | 标记为装饰性图片（aria-hidden=true 并清空 alt） |
| `ariaLabel` | `string \| ((ctx) => string)` | `undefined` | 自定义 aria-label（函数型，参见用法示例） |
| `statusText` | `{ loading?; loaded?; error? }` | `undefined` | 视觉隐藏的状态播报文本 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AdaptiveQualityPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `lowQ` | `number` | `40(2g/3g)` | 低速网络质量值(1~100) |
| `highQ` | `number` | `80(4g)` | 高速网络质量值(1~100) |
| `saveDataQuality` | `number` | `35` | 省流模式质量值(1~100) |
| `overrideEffectiveType` | `"4g" \| "3g" \| "2g" \| "slow-2g"` | `undefined` | Demo/测试覆盖网络类型 |
| `overrideSaveData` | `boolean` | `undefined` | Demo/测试覆盖省流开关 |
| `mode` | `"once" \| "realtime"` | `once` | once 仅初始一次 / realtime 监听变化 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AltTextPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `derive` | `(src: string) => string` | `undefined` | 自定义推导函数（函数型，参见用法示例） |
| `prefix` | `string` | `Image` | 默认推导前缀（如 "Image"） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AnimatedCursorPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `style` | `"zoom-in" \| "zoom-out" \| "pointer" \| "crosshair" \| "move" \| "grab" \| "custom-dot" \| "custom-ring" \| "custom-plus" \| "none"` | `zoom-in` | 光标样式 |
| `enableFollower` | `boolean` | `true` | 是否启用跟随光标 |
| `followerColor` | `string` | `rgba(59, 130, 246, 0.5)` | 跟随光标颜色 |
| `followerSize` | `number` | `40` | 跟随光标大小（px） |
| `followerDelay` | `number` | `0.1` | 跟随延迟系数（越大越跟手） |
| `scaleOnHover` | `boolean` | `true` | 悬停时跟随光标缩放 |
| `hoverScale` | `number` | `1.5` | 悬停缩放比例 |
| `customIcon` | `string` | `` | 自定义光标图标 URL |
| `cursorText` | `string` | `` | 光标附带文字 |
| `showRipple` | `boolean` | `false` | 点击时产生涟漪 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AntiHotlinkPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `allowedDomains` | `string[]` | - | 域名白名单；仅放行列表内域，其余源原样通过 |
| `checkReferer` | `boolean` | `false` | 无 referrer 时附加 ref=direct 标记（仅浏览器环境有效） |
| `generateToken` | `(src: string) => string \| undefined` | - | 为 URL 生成签名 token（函数型，仅顶层示例展示） |
| `tokenParam` | `string` | `token` | 追加到查询参数的键名 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AspectRatioSpacerPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `ratio` | `number` | `4/3` | 宽/高比，如 4/3、16/9，或直接传数字 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AuthPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `token` | `string \| (() => string \| undefined)` | - | 访问凭证；支持函数动态获取（函数型仅顶层示例展示） |
| `tokenParam` | `string` | - | 追加到查询参数的键名 |
| `crossOrigin` | `"anonymous" \| "use-credentials"` | - | img 的 crossOrigin 属性 |
| `referrerPolicy` | `React.HTMLAttributeReferrerPolicy` | - | img 的 referrerPolicy 属性 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### BadgePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string \| ((context) => string)` | `Badge` | 徽章文字（支持函数动态生成） |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "center"` | `top-left` | 徽章位置（四角或中心） |
| `bgColor` | `string` | `rgba(0,0,0,0.6)` | 背景色 |
| `color` | `string` | `#fff` | 文字色 |
| `fontSize` | `number` | `12` | 字号(px) |
| `padding` | `string` | `2px 6px` | 内边距 |
| `borderRadius` | `number` | `4` | 圆角(px) |
| `zIndex` | `number` | `3` | 层级 |
| `showWhen` | `"always" \| "loading" \| "loaded" \| "error"` | `loaded` | 显示时机 |
| `enabled` | `boolean` | `true` | 是否启用 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### BatteryAwarePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 |
| `lowBatteryThreshold` | `number` | `0.2` | 低电量阈值(0~1) |
| `downgradeWidth` | `number` | `640` | 降级时的请求宽度(px) |
| `disablePreconnect` | `boolean` | `true` | 低电量时是否禁用预连接 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### BlurUpPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `startBlur` | `number` | `8` | 起始模糊半径 px |
| `endBlur` | `number` | `0` | 结束模糊半径 px |
| `durationMs` | `number` | `400` | 过渡时长 ms |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### BorderGlowPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | `rgba(0, 153, 255, 0.6)` | 辉光颜色 |
| `blurPx` | `number` | `12` | 辉光模糊半径 px |
| `spreadPx` | `number` | `2` | 辉光扩散 px |
| `hoverMultiplier` | `number` | `1.4` | 悬停时辉光强度倍数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CacheIDBPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 IndexedDB 缓存（关闭后每次都走网络） |
| `dbName` | `string` | `LLI-Cache` | IndexedDB 数据库名，多实例共用同一个库 |
| `storeName` | `string` | `images` | 对象仓库名，缓存条目存在该 store 下 |
| `ttlMs` | `number` | `604800000` | 过期时间（毫秒） |
| `debug` | `boolean` | - | 是否输出读写 / 命中调试日志 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `onSrcChange` | src 变化、切换到新图时 | 重置状态、清理旧缓存、重新进入懒加载判定 |
| `cache:hit` | 命中 IndexedDB 缓存、跳过网络请求时 | 携带 { level, src }，可用于统计缓存命中率 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CacheMemoryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用内存缓存 |
| `maxEntries` | `number` | `200` | LRU 最大条目 |
| `ttlMs` | `number` | - | 过期时间，默认不过期 |
| `debug` | `boolean` | `false` | 是否输出 LRU 命中 / 淘汰调试日志 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `onSrcChange` | src 变化、切换到新图时 | 重置状态、清理旧缓存、重新进入懒加载判定 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CachePrewarmPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用预热 |
| `trigger` | `"enter" \| "mount"` | `enter` | 触发时机：进入视口或挂载 |
| `preferMemory` | `boolean` | `true` | 预热时优先写内存 |
| `debug` | `boolean` | `false` | 是否输出预热调试日志 |
| `showBadge` | `boolean` | `false` | 是否在卡片上显示预热状态徽标（便于观察） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onEnterViewport` | 元素进入视口（IntersectionObserver） | 触发懒加载、开始请求、曝光上报 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CaptionPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string \| ((src?: string) => string)` | `` | 说明文字；可传函数按 src 派生 |
| `position` | `"top" \| "bottom"` | `bottom` | 文字位置 |
| `bg` | `string` | `rgba(0,0,0,0.62)` | 背景色 |
| `color` | `string` | `#fff` | 文字颜色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CarouselPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `interval` | `number` | `3000` | 每帧停留时长（ms） |
| `autoStart` | `boolean` | `false` | 初始是否自动播放 |
| `pauseOnHover` | `boolean` | `true` | 悬停图集根容器时暂停 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryToolbarArea` | 渲染图库工具栏时 | 缩放、下载、分享等图库级操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setActiveIndex` | `ctx.setActiveIndex(i: number): void` | 切换图库当前激活图索引，并联动缩略图与预加载 |

### CDNFallbackPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `cdnBases` | `string[]` | - | 备用 CDN 基址列表，首个即主用 CDN。e.g. ["https://cdn1.example.com", "https://cdn2.example.com"] |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |
| `onSrcChange` | src 变化、切换到新图时 | 重置状态、清理旧缓存、重新进入懒加载判定 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ColorExtractionPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `setContainerBg` | `boolean` | `true` | 是否把容器背景设为主色 |
| `sampleSize` | `number` | `4` | 采样步长 px，越大越快越不精确 |
| `showOverlay` | `boolean` | `true` | 是否在右上角显示主色卡 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ColorSwatchPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxColors` | `number` | `5` | 提取颜色数量上限 |
| `showPalette` | `boolean` | `true` | 是否显示色板 |
| `position` | `"bottom" \| "overlay" \| "bottom-center"` | `bottom` | 色板位置 |
| `swatchSize` | `number` | `32` | 色块尺寸（px） |
| `interactive` | `boolean` | `true` | 是否可点击选择 |
| `showColorCode` | `boolean` | `false` | 是否显示 HEX 代码 |
| `gap` | `number` | `8` | 色块间距（px） |
| `onColorSelect` | `(color) => void` | `undefined` | 颜色选择回调 |
| `style` | `React.CSSProperties` | `{}` | 自定义叠加样式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ComparisonPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `beforeSrc` | `string` | `主图 src` | 左侧（拖动前）对比图；默认用主图 |
| `afterSrc` | `string` | `主图 src` | 右侧（拖动后）对比图；默认用主图 |
| `labelBefore` | `string` | `前` | 左图标签文字 |
| `labelAfter` | `string` | `后` | 右图标签文字 |
| `start` | `number` | `0.5` | 初始分割位置（0~1） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ConcurrencyControlPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxConcurrent` | `number` | `4` | 并发上限（4g 情况的上限） |
| `scope` | `"global" \| "perHost"` | `global` | 作用域：全局或按域名分片 |
| `adaptive` | `boolean` | `true` | 是否根据网络自适应并发（saveData/2g/3g 降低并发） |
| `acquireTimeoutMs` | `number` | `8000` | 获取并发许可的超时（毫秒），超时后不阻塞加载，避免饥饿 |
| `debug` | `boolean` | `false` | 调试输出 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CounterPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `prefix` | `string` | - | 前缀文案 |
| `separator` | `string` | ` / ` | 当前与总数之间的分隔符 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryToolbarArea` | 渲染图库工具栏时 | 缩放、下载、分享等图库级操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CropPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用裁剪 |
| `focusPoint` | `{ x: number; y: number }` | `{ x: 0.5, y: 0.5 }` | 裁剪焦点(0~1 相对坐标) |
| `showLabel` | `boolean` | `true` | 是否在图片左上角显示焦点标识（生产版式建议关闭） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CustomEffectsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `imageStyle` | `React.CSSProperties` | `{}` | 应用到 &lt;img&gt; 的任意内联样式，如 { filter: "contrast(1.2) saturate(1.4)" } |
| `imageClassName` | `string` | `` | 附加到 &lt;img&gt; 的 className |
| `containerStyle` | `React.CSSProperties` | `{}` | 应用到容器（卡片）的任意内联样式 |
| `containerClassName` | `string` | `` | 附加到容器的 className |
| `hoverImageStyle` | `React.CSSProperties` | `{}` | 悬停时叠加到 &lt;img&gt; 的样式（移出还原），如 { transform: "scale(1.08)" } |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DataSaverPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `respectSaveData` | `boolean` | `true` | 仅在 navigator.connection.saveData=true 时降质（关闭则强制降质） |
| `fallbackQuality` | `number` | `0.6` | 0..1 |
| `disablePreload` | `boolean` | `true` | 省流量模式下禁用 preload / prefetch 预取 |
| `qualityParam` | `string` | `quality` | query param name, e.g. "quality" or "q" |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DecodeAfterIdlePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用空闲解码 |
| `timeoutMs` | `number` | `600` | 最长等待空闲的兜底时间(ms) |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DepthMapPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `style` | `"tilt" \| "parallax" \| "float" \| "rotate-3d"` | `tilt` | 深度效果样式 |
| `intensity` | `number` | `0.5` | 效果强度 0~1 |
| `maxTilt` | `number` | `20` | 最大倾斜角度 |
| `enablePerspective` | `boolean` | `true` | 启用透视效果 |
| `perspective` | `number` | `1000` | 透视距离（px） |
| `enableGlare` | `boolean` | `true` | 启用光泽效果 |
| `glareColor` | `string` | `rgba(255, 255, 255, 0.3)` | 光泽颜色 |
| `glareOpacity` | `number` | `0.5` | 光泽不透明度 0~1 |
| `enableShadow` | `boolean` | `true` | 启用阴影 |
| `transitionDuration` | `number` | `300` | 过渡时长（毫秒） |
| `resetOnLeave` | `boolean` | `true` | 离开时重置 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DominantColorPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | `rgba(0,0,0,0.06)` | 指定背景色（未提供时尝试从 lqip 采样） |
| `lqipSrc` | `string \| ((src) => string)` | `undefined` | 低清预览图地址或生成函数（用于采样平均色） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DownloadButtonPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `filename` | `string` | `undefined` | 下载文件名 |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-right` | 按钮位置 |
| `size` | `"small" \| "medium" \| "large"` | `medium` | 按钮尺寸 |
| `buttonStyle` | `React.CSSProperties` | `{}` | 自定义按钮样式 |
| `showOnHover` | `boolean` | `false` | 仅悬停时显示 |
| `onBeforeDownload` | `(src) => void \| Promise<void>` | `undefined` | 下载前回调（可做权限校验） |
| `onDownloadSuccess` | `(filename) => void` | `undefined` | 下载成功回调 |
| `onDownloadError` | `(error) => void` | `undefined` | 下载失败回调 |
| `customIcon` | `ReactNode` | `undefined` | 自定义图标 |
| `tooltipText` | `string` | `下载图片` | 提示文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ErrorBadgePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string \| ((context: LazyImageContext) => string)` | `Error` | 徽标文字；支持函数按 ctx 动态生成（函数型仅顶层示例展示） |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "center"` | `top-right` | 徽标定位角落 |
| `bgColor` | `string` | `rgba(220, 53, 69, 0.85)` | 背景色 |
| `color` | `string` | `#fff` | 文字颜色 |
| `fontSize` | `number` | `12` | 字号(px) |
| `padding` | `string` | `2px 6px` | 内边距 |
| `borderRadius` | `number` | `4` | 圆角(px) |
| `zIndex` | `number` | `100` | 层级，默认较高避免被其它覆盖层遮挡 |
| `persistAfterFallback` | `boolean` | `true` | 回退图加载成功后是否仍显示徽标 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ErrorOverlayPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `message` | `string \| ((context: LazyImageContext) => string)` | `undefined（回退『加载失败』）` | 遮罩提示文案；支持函数按 ctx 动态生成（函数型仅顶层示例展示） |
| `background` | `string` | `rgba(220, 53, 69, 0.18)` | 遮罩背景色 |
| `color` | `string` | `#b00020` | 文字颜色 |
| `zIndex` | `number` | `10` | 遮罩层级 |
| `showRetry` | `boolean` | `true` | 是否显示重试按钮 |
| `retryText` | `string` | `重试` | 重试按钮文字 |
| `persistAfterFallback` | `boolean` | `true` | 回退图加载成功后是否仍显示遮罩 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ErrorTrackingPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `reportEndpoint` | `string` | - | 错误上报端点（POST JSON，带 5s 超时与 keepalive） |
| `report` | `(payload: any) => void` | - | 自定义上报函数（与端点二选一或并存） |
| `showBadge` | `boolean` | `false` | 是否显示错误计数角标（需显式开启） |
| `badgeText` | `string` | `Error` | 角标前缀文字 |
| `badgeColor` | `string` | `#fff` | 角标文字色 |
| `badgeBg` | `string` | `rgba(220,53,69,0.8)` | 角标背景色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### EventLoggerPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用日志 |
| `prefix` | `string` | `[LLI]` | 日志前缀，便于过滤 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onBeforeLoad` | 发起图片请求之前 | 返回 false 可阻断本次加载（如权限校验、占位策略） |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |
| `onProgress` | 加载进度更新（由 withPlugins 订阅 bus 的 "progress" 桥接） | 展示进度条 / 百分比；仅对支持进度上报的 loader 生效 |
| `onEnterViewport` | 元素进入视口（IntersectionObserver） | 触发懒加载、开始请求、曝光上报 |
| `onLeaveViewport` | 元素离开视口 | 暂停 / 中止在途请求、回收资源 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ExifOrientationPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用方向校正 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FadeInPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `durationMs` | `number` | `400` | 淡入时长 ms |
| `easing` | `string` | `ease` | 缓动函数（CSS easing） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FallbackImagePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fallbackSrc` | `string` | - | 兜底图地址，建议使用始终可访问的占位图或 data URI。e.g. "/404.jpg" |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FavoritePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `onChange` | `(favorited: boolean) => void` | `-` | 切换时回调（持久化/上报） |
| `activeColor` | `string` | `#ff5a5f` | 激活态颜色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryToolbarArea` | 渲染图库工具栏时 | 缩放、下载、分享等图库级操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setFavorited` | `ctx.setFavorited(v: boolean): void` | 写入收藏态并触发重渲染（收藏按钮的唯一致入口） |

### FetchLoaderPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 fetch 加载（关闭后走浏览器默认加载） |
| `cacheKeyFn` | `(src: string) => string` | - | 自定义去重键，默认使用 src |
| `maxCacheSize` | `number` | - | in-flight 请求缓存最大条目数 |
| `maxControllers` | `number` | - | AbortController 缓存上限，淘汰时自动 abort |
| `maxObjectUrls` | `number` | - | objectURL 缓存上限，淘汰时自动 revokeObjectURL |
| `timeout` | `number` | `30000` | 单次请求超时（毫秒） |
| `maxRetries` | `number` | `3` | 最大重试次数（4xx 不重试） |
| `retryDelay` | `number` | `1000` | 首次重试延迟（毫秒） |
| `retryBackoff` | `number` | `2` | 重试退避倍数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `onSrcChange` | src 变化、切换到新图时 | 重置状态、清理旧缓存、重新进入懒加载判定 |
| `progress` | 流式加载进度更新时 | 广播 { loaded, total }，桥接到 onProgress 钩子 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FilterPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `filter` | `"none" \| "grayscale" \| "sepia" \| "brightness" \| "contrast" \| "saturate"` | `none` | 滤镜类型 |
| `amount` | `number` | `undefined` | 滤镜强度（多数类型 0~1） |
| `hover` | `boolean` | `false` | 悬停时恢复原图 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FullscreenPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enterLabel` | `string` | `⛶ 全屏` | 进入全屏按钮文案 |
| `exitLabel` | `string` | `✕ 退出` | 退出全屏按钮文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryToolbarArea` | 渲染图库工具栏时 | 缩放、下载、分享等图库级操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### GalleryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `buttonText` | `string` | `Open` | 打开按钮文案 |
| `enableLightbox` | `boolean` | `true` | 是否启用内置灯箱 |
| `overlayZIndex` | `number` | `10` | 灯箱层叠顺序 |
| `buttonStyle` | `React.CSSProperties` | `{}` | 按钮自定义样式（缩略图场景可缩成小号半透明胶囊） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### GlitchEffectPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `style` | `"rgb-split" \| "scan-lines" \| "digital" \| "glitch-mix" \| "intense"` | `glitch-mix` | 故障风格 |
| `continuous` | `boolean` | `false` | 是否持续动画 |
| `duration` | `number` | `1000` | 一次性触发时长（毫秒） |
| `intensity` | `number` | `0.7` | 效果强度 0~1 |
| `triggerOnHover` | `boolean` | `false` | 是否悬停触发 |
| `rgbOffset` | `number` | `3` | RGB 分离距离（px） |
| `scanLineCount` | `number` | `30` | 扫描线数量 |
| `animateScanLines` | `boolean` | `true` | 扫描线是否动画 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### HotspotPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `hotspots` | `Hotspot[]` | `[]` | 热点集合（图集级，所有主图共用），含 x/y(0-100)/label/href? |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryOverlay` | 渲染图库大图浮层时 | 大图视图、切换器、关闭按钮等浮层内容 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### HoverPrefetchPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `getNextSrc` | `(context) => string \| string[] \| Promise<...>` | `undefined` | 计算需要预取的下一张图片（函数型，参见用法示例） |
| `target` | `"container" \| "image"` | `container` | 绑定事件的目标（容器或图片元素） |
| `trigger` | `"mouseenter" \| "touchstart"` | `mouseenter` | 触发事件类型 |
| `as` | `"image" \| "fetch"` | `image` | 预取资源类型 |
| `max` | `number` | `2` | 预取的最大数量 |
| `dedupe` | `boolean` | `true` | 去重，避免重复插入相同的预取链接 |
| `crossOrigin` | `"anonymous" \| "use-credentials" \| null` | `anonymous` | 跨域策略 |
| `showBadge` | `boolean` | `false` | 是否在卡片上显示「已预取 N」徽标（便于观察注入效果） |
| `debug` | `boolean` | `false` | 是否输出调试日志 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### HoverZoomPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `scale` | `number` | `1.08` | 放大倍数 |
| `durationMs` | `number` | `180` | 过渡时长 ms |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ImageOptimizationPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 URL 改写优化 |
| `maxWidth` | `number` | `1920` | 最大宽度（像素） |
| `quality` | `number` | `0.85` | 0..1 |
| `format` | `"auto" \| "webp" \| "jpg" \| "png"` | `auto` | 目标格式；auto 交给浏览器 / CDN 协商 |
| `widthParam` | `string` | `w` | 例如 "w" |
| `qualityParam` | `string` | `q` | 例如 "q" |
| `formatParam` | `string` | `format` | 例如 "format" |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### IndicatorPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `number` | `8` | 圆点直径（px） |
| `gap` | `number` | `6` | 圆点间距（px） |
| `activeColor` | `string` | `#2b7de9` | 选中圆点颜色 |
| `idleColor` | `string` | `rgba(0,0,0,0.25)` | 未选中圆点颜色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryToolbarArea` | 渲染图库工具栏时 | 缩放、下载、分享等图库级操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setActiveIndex` | `ctx.setActiveIndex(i: number): void` | 切换图库当前激活图索引，并联动缩略图与预加载 |

### InventoryStatusPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `status` | `"in-stock" \| "out-of-stock" \| "low-stock" \| "pre-order"` | `in-stock` | 初始库存状态 |
| `stockCount` | `number` | `undefined` | 库存数量 |
| `lowStockThreshold` | `number` | `10` | 低库存阈值 |
| `showBadge` | `boolean` | `true` | 是否显示角标 |
| `autoRefresh` | `boolean` | `false` | 是否自动刷新库存 |
| `refreshInterval` | `number` | `30000` | 刷新间隔（毫秒） |
| `fetchStock` | `() => Promise<{ status?; count? }>` | `undefined` | 自定义库存获取函数 |
| `onStatusChange` | `(status) => void` | `undefined` | 状态变更回调 |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-right` | 角标位置 |
| `style` | `React.CSSProperties` | `{}` | 自定义叠加样式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LocalizationPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `localeMap` | `Record<string, string>` | `undefined` | 语言 → 图片 URL 映射 |
| `defaultLocale` | `string` | `en` | 默认语言（后备） |
| `currentLocale` | `string` | `undefined` | 手动指定当前语言 |
| `autoDetect` | `boolean` | `true` | 是否自动检测浏览器语言 |
| `detectLocale` | `() => string` | `undefined` | 自定义语言检测函数 |
| `fallbackSrc` | `string` | `undefined` | 最终后备图片 URL |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LQIPPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `lqipSrc` | `string \| ((src) => string)` | `undefined` | 低清预览图地址或生成函数 |
| `blur` | `number` | `12` | 模糊半径(px) |
| `opacity` | `number` | `1` | 不透明度(0~1) |
| `zIndex` | `number` | `2` | 叠加层级 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MemoryPressureAbortPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 |
| `deviceMemoryThreshold` | `number` | `4` | 设备内存 ≤ 该阈值(GB)时启用降质 |
| `preferOnMobile` | `boolean` | `true` | 移动端或省流模式时强制启用降质 |
| `lowWidth` | `number` | `640` | 重写到的低清晰度宽度参数 |
| `abortOnLeave` | `boolean` | `true` | 离开视口且仍在加载时，是否中止在途加载（context.reset） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `onLeaveViewport` | 元素离开视口 | 暂停 / 中止在途请求、回收资源 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `reset` | `ctx.reset(): void` | 重置到初始状态（清空错误与进度，不主动重新发起加载） |

### MorphPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `"circle-to-square" \| "square-to-circle" \| "rounded-corners" \| "scale-morph" \| "rotate-morph" \| "skew-morph" \| "elastic" \| "liquid" \| "custom"` | `elastic` | 形变类型 |
| `duration` | `number` | `800` | 持续时间（毫秒） |
| `delay` | `number` | `0` | 延迟（毫秒） |
| `easing` | `string` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | 缓动函数 |
| `triggerOnHover` | `boolean` | `false` | 是否悬停触发 |
| `continuous` | `boolean` | `false` | 是否持续动画 |
| `fromBorderRadius` | `string` | `50%` | rounded-corners 起始圆角 |
| `toBorderRadius` | `string` | `0%` | rounded-corners 结束圆角 |
| `fromScale` | `number` | `1` | scale-morph 起始缩放 |
| `toScale` | `number` | `1` | scale-morph 结束缩放 |
| `fromRotate` | `number` | `0` | rotate-morph 起始角度 |
| `toRotate` | `number` | `0` | rotate-morph 结束角度 |
| `fromSkew` | `number` | `0` | skew-morph 起始倾斜 |
| `toSkew` | `number` | `0` | skew-morph 结束倾斜 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### NetworkAnalyticsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `reportEndpoint` | `string` | - | 上报地址（POST JSON）；留空则只在本地统计 |
| `report` | `(event: string, data: Record<string, any>) => void` | - | 自定义上报函数（若提供则优先使用） |
| `trackCDN` | `boolean` | - | 是否按图片域名分组统计，便于比较不同 CDN 表现 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### OfflinePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `offlineSrc` | `string` | `内置 SVG 离线占位图（data URI）` | 离线且无缓存时回退的占位图，建议用 data URI 避免再次走网络 |
| `cacheName` | `string` | `vane-lazy-image-offline` | Cache Storage 名称，用于预热与离线回退 |
| `warm` | `boolean` | `true` | 在线时是否把资源写入 Cache Storage 预热 |
| `showBadge` | `boolean` | `true` | 离线时是否显示「离线模式」徽标 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### OverlayInfoPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | `string \| ((context: LazyImageContext) => string)` | `` | 覆盖层文本；可传函数按 context 派生 |
| `position` | `"top" \| "bottom" \| "center"` | `bottom` | 文本位置 |
| `background` | `string` | `rgba(0,0,0,0.62)` | 背景色 |
| `color` | `string` | `#fff` | 文字颜色 |
| `fontSize` | `number` | `12` | 字号 px |
| `padding` | `string` | `6px 10px` | 内边距 |
| `borderRadius` | `number` | `0` | 圆角 px |
| `zIndex` | `number` | `2` | 层叠顺序 |
| `showWhen` | `"always" \| "loading" \| "loaded" \| "error"` | `always` | 何时显示 |
| `trigger` | `"always" \| "hover"` | `always` | 触发方式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ParallaxPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `strength` | `number` | `0.2` | 偏移强度 0..1 |
| `axis` | `"y" \| "x"` | `y` | 偏移轴向 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PerformanceMonitorPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showOverlay` | `boolean` | `true` | 是否在图片上叠加耗时面板 |
| `overlayPosition` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-right` | 面板位置（四角） |
| `color` | `string` | `#fff` | 文字色 |
| `background` | `string` | `rgba(0,0,0,0.45)` | 面板背景 |
| `onReport` | `(data: { src; durationMs; network?; device? }) => void` | `undefined` | 加载完成上报回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PreconnectPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `domains` | `string[]` | - | 额外预连接域名 |
| `crossOrigin` | `string \| null` | - | "anonymous" | "use-credentials" | null |
| `showBadge` | `boolean` | `false` | 是否在卡片上显示「已预连 N」徽标（便于观察注入效果） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onSrcChange` | src 变化、切换到新图时 | 重置状态、清理旧缓存、重新进入懒加载判定 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PredictiveLoadingPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `model` | `"heuristic" \| "ml"` | `heuristic` | 预测模型；ml 当前同样走启发式（真正模型由 predict 提供） |
| `strategy` | `"increment" \| "decrement"` | `increment` | 内置启发式：派生方向（递增/递减 URL 末尾数字段） |
| `predict` | `(context) => string[] \| Promise<string[]>` | `未设置（用内置启发式）` | 自定义预测：返回需要预加载的图片链接列表，优先级高于内置启发式 |
| `maxPreload` | `number` | `3` | 单次最多预取数量 |
| `as` | `"image" \| "fetch"` | `image` | preload 资源类型 |
| `crossOrigin` | `"anonymous" \| "use-credentials" \| null` | `anonymous` | 跨域策略 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PriceTagPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `price` | `number` | `undefined` | 当前价格 |
| `currency` | `string` | `$` | 货币符号 |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-right` | 标签位置（四角） |
| `originalPrice` | `number` | `undefined` | 原价（划线显示） |
| `discount` | `string` | `undefined` | 折扣文案，如 “40% OFF” |
| `showSavings` | `boolean` | `false` | 是否计算并显示节省金额 |
| `backgroundColor` | `string` | `#c62828` | 标签背景色 |
| `textColor` | `string` | `#fff` | 标签文字色 |
| `animate` | `boolean` | `true` | 淡入动画 |
| `style` | `React.CSSProperties` | `{}` | 自定义叠加样式 |
| `fetchPrice` | `(context) => Promise<{ price; originalPrice?; discount? }>` | `undefined` | 异步获取价格（API 集成） |
| `loadingText` | `string` | `加载中...` | 异步加载文案 |
| `errorText` | `string` | `价格获取失败` | 异步失败文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PriorityLoadingPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `priority` | `"high" \| "medium" \| "low"` | `medium` | 加载优先级：high→loading=eager / low→lazy+大 rootMargin / medium→lazy |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ProgressOverlayPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showWhen` | `"always" \| "loading"` | `loading` | 何时显示 |
| `height` | `number` | `3` | 进度条高度 px |
| `color` | `string` | `#4a90e2` | 进度条颜色 |
| `background` | `string` | `transparent` | 背景遮罩色 |
| `showPercentText` | `boolean` | `false` | 是否显示百分比文本 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onProgress` | 加载进度更新（由 withPlugins 订阅 bus 的 "progress" 桥接） | 展示进度条 / 百分比；仅对支持进度上报的 loader 生效 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PromoBadgePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `"new" \| "hot" \| "sale" \| "limited" \| "bestseller" \| "custom"` | `hot` | 预设标签类型 |
| `text` | `string` | `undefined` | 自定义文案（type=custom 时生效） |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-left` | 角标位置（四角） |
| `backgroundColor` | `string` | `undefined` | 背景色 |
| `color` | `string` | `undefined` | 文字色 |
| `animate` | `boolean` | `true` | 淡入动画 |
| `pulse` | `boolean` | `false` | 脉冲呼吸动画 |
| `ribbon` | `boolean` | `false` | 丝带样式（倾斜 45°） |
| `style` | `React.CSSProperties` | `{}` | 自定义叠加样式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RedactionPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 |
| `boxes` | `RedactionBox[]` | `[]` | 遮挡区域：{ x, y, w, h (0~1), blur?, color? } |
| `zIndex` | `number` | `3` | 层叠顺序 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ResponsivePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用响应式 |
| `variants` | `{ width: number; src?: string }[]` | `[{400},{800},{1200}]` | 宽度变体列表 |
| `buildSrc` | `(baseSrc, width) => string` | `defaultBuildSrc（追加 ?w=）` | 自定义链接生成（函数型，参见用法示例） |
| `sizes` | `string` | `(max-width: 800px) 100vw, 800px` | sizes 属性 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RetryOnErrorPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxRetries` | `number` | `2` | 最大重试次数 |
| `baseDelayMs` | `number` | - | 退避基准毫秒（默认 500） |
| `jitter` | `boolean` | - | 是否在退避基础上叠加随机抖动 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |
| `onSrcChange` | src 变化、切换到新图时 | 重置状态、清理旧缓存、重新进入懒加载判定 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RevealAnimationPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `animation` | `"fade" \| "fade-up" \| "fade-down" \| "fade-left" \| "fade-right" \| "zoom-in" \| "zoom-out" \| "rotate-in" \| "flip-x" \| "flip-y" \| "slide-up" \| "slide-down" \| "slide-left" \| "slide-right" \| "bounce" \| "elastic" \| "custom"` | `fade-up` | 动画类型 |
| `duration` | `number` | `600` | 持续时间（毫秒） |
| `delay` | `number` | `0` | 延迟（毫秒） |
| `easing` | `string` | `ease-out` | 缓动函数 |
| `customAnimation` | `string` | `` | 自定义动画名（animation 为 custom 时生效） |
| `customKeyframes` | `string` | `` | 自定义 keyframes 文本 |
| `fillMode` | `"none" \| "forwards" \| "backwards" \| "both"` | `both` | 动画填充模式 |
| `disabled` | `boolean` | `false` | 是否禁用 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ScrollIdlePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `idleMs` | `number` | `120` | 判定为“空闲”的静止时间（毫秒） |
| `onlyWhenIntersecting` | `boolean` | `true` | 是否仅在进入视口后生效（否则所有加载都会等待空闲） |
| `maxWaitMs` | `number` | `1200` | 最长等待空闲的时间（毫秒），超过则直接继续加载，避免长时间滚动导致饥饿 |
| `target` | `"window" \| "container"` | `window` | 监听对象：window 或容器（容器将使用 context.containerRef.current） |
| `axis` | `"vertical" \| "horizontal" \| "both"` | `vertical` | 滚动轴向：vertical/horizontal/both（目前用于调试标注，可按需扩展策略） |
| `debug` | `boolean` | `false` | 调试输出 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SEOPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 |
| `altFallback` | `string` | `undefined` | 未提供 alt 时的回退值 |
| `title` | `string` | `undefined` | 图片 title（提示与关键词） |
| `aspectRatio` | `string` | `undefined` | 固定容器宽高比（如 "4/3"），减少 CLS |
| `priority` | `"auto" \| "lcp"` | `auto` | lcp 时设为 eager 加载 |
| `preload` | `boolean` | `false` | 挂载时注入 preload 预载 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SkeletonPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `"shimmer" \| "pulse"` | `shimmer` | 动画类型 |
| `backgroundColor` | `string` | `#e5e7eb` | 底色 |
| `highlightColor` | `string` | `#f3f4f6` | shimmer 高亮色 |
| `borderRadius` | `number` | `6` | 圆角 px |
| `zIndex` | `number` | `1` | 层叠顺序 |
| `showWhen` | `"always" \| "loading"` | `loading` | 何时显示 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SocialSharePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `platforms` | `Array<"facebook"\|"twitter"\|"pinterest"\|"linkedin"\|"whatsapp"\|"wechat">` | `["facebook","twitter","pinterest"]` | 分享平台列表 |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-right` | 主按钮位置 |
| `showOnHover` | `boolean` | `false` | 悬停显示模式 |
| `title` | `string` | `分享图片` | 分享标题 |
| `description` | `string` | `` | 分享描述 |
| `ogImage` | `string` | `undefined` | Pinterest 等使用的媒体图 |
| `size` | `"small" \| "medium" \| "large"` | `medium` | 按钮尺寸 |
| `onShare` | `(platform) => void` | `undefined` | 分享回调 |
| `style` | `React.CSSProperties` | `{}` | 自定义容器样式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### Spin360Plugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `sensitivity` | `number` | `6` | 拖拽灵敏度：像素位移超过该值才翻一帧 |
| `autoPlay` | `boolean` | `false` | 是否自动旋转 |
| `autoPlayInterval` | `number` | `120` | 自动旋转间隔（ms） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryOverlay` | 渲染图库大图浮层时 | 大图视图、切换器、关闭按钮等浮层内容 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setFrameIndex` | `ctx.setFrameIndex(i: number): void` | 切换 360° 环物当前帧（写入图集协调态，触发重新渲染） |

### SvgPlaceholderPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `svgContent` | `string \| ((context) => string)` | `undefined` | SVG 字符串或动态生成函数 |
| `background` | `string` | `transparent` | 叠加层背景 |
| `opacity` | `number` | `1` | 不透明度(0~1) |
| `zIndex` | `number` | `3` | 叠加层级 |
| `showWhen` | `"always" \| "idle" \| "loading" \| "loaded" \| "error"` | `loading` | 显示条件 |
| `fadeOutOnLoaded` | `boolean` | `true` | 加载成功后是否淡出 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ThumbPreloadPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `lookahead` | `number` | `1` | 向后预加载张数 |
| `alsoPrevious` | `boolean` | `false` | 是否也预加载前一张 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onActiveChange` | 图库当前激活图切换后 | 同步缩略图高亮、预加载相邻图、更新 URL |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ThumbSyncPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `gap` | `number` | `8` | 缩略图间距（px） |
| `thumbWidth` | `number` | `64` | 缩略图宽（px） |
| `thumbHeight` | `number` | `64` | 缩略图高（px） |
| `showActiveRing` | `boolean` | `true` | 选中缩略图描边高亮 |
| `radius` | `number` | `6` | 缩略图圆角（px） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryThumbArea` | 渲染图库缩略图条时 | 底部 / 侧边缩略图列表 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setActiveIndex` | `ctx.setActiveIndex(i: number): void` | 切换图库当前激活图索引，并联动缩略图与预加载 |

### TransitionPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `durationMs` | `number` | `400` | 过渡时长 ms |
| `easing` | `string` | `ease` | 缓动函数 |
| `fromOpacity` | `number` | `0` | 起始透明度 |
| `toOpacity` | `number` | `1` | 结束透明度 |
| `fromScale` | `number` | `1` | 起始缩放 |
| `toScale` | `number` | `1` | 结束缩放 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### UserBehaviorPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用统计与面板 |
| `onReport` | `(data: { src; dwellMs; clicks; enters; leaves }) => void` | `undefined` | 卸载时上报回调（默认打印到控制台） |
| `showOverlay` | `boolean` | `true` | 是否在图片角落显示统计面板（生产版式建议关闭） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onLoadSuccess` | 图片成功解码可显示时 | 拿到最终 displaySrc 做后续动作（上报、预取下张、淡入） |
| `onEnterViewport` | 元素进入视口（IntersectionObserver） | 触发懒加载、开始请求、曝光上报 |
| `onLeaveViewport` | 元素离开视口 | 暂停 / 中止在途请求、回收资源 |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### VideoPosterPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `videoUrl` | `string` | `undefined` | 视频 URL |
| `autoPlay` | `boolean` | `true` | 自动播放 |
| `loop` | `boolean` | `false` | 循环播放 |
| `muted` | `boolean` | `true` | 静音（移动端自动播放需静音） |
| `playButtonPosition` | `"center" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `center` | 播放按钮位置 |
| `playButtonSize` | `"small" \| "medium" \| "large"` | `large` | 按钮尺寸 |
| `playButtonStyle` | `React.CSSProperties` | `{}` | 自定义按钮样式 |
| `showPlayButton` | `boolean` | `true` | 是否显示播放按钮 |
| `playInModal` | `boolean` | `true` | 模态框播放（否则内联） |
| `playIcon` | `ReactNode` | `undefined` | 自定义播放图标 |
| `onPlay` | `() => void` | `undefined` | 播放回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ViewportAwarePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `rootMargin` | `string` | `未设置（沿用 Core 默认 0px）` | IO 边距，控制提前/延后触发。如 "200px" 表示进入视口前 200px 就开始加载（预加载），"-50px" 表示进入后再等 50px |
| `threshold` | `number \| number[]` | `未设置` | IO 触发阈值（0~1），控制加载灵敏度 |
| `once` | `boolean` | `true` | 是否只加载一次：true=进入视口加载后停止观察（省资源）；false=持续观察 |
| `unobserveOnVisible` | `boolean` | `由 once 推导` | 显式下发，优先级高于 once |
| `showDot` | `boolean` | `false` | 是否显示视口指示点（仅辅助观察，非核心能力） |
| `dotPosition` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `bottom-right` | 指示点位置 |
| `hideWhenOut` | `boolean` | `false` | 离开视口时隐藏指示点 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onEnterViewport` | 元素进入视口（IntersectionObserver） | 触发懒加载、开始请求、曝光上报 |
| `onLeaveViewport` | 元素离开视口 | 暂停 / 中止在途请求、回收资源 |
| `transformProps` | 渲染前链式改写图片 props | 补 sizes / 占位色 / 解码策略等 |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ViewportDebouncePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `debounceMs` | `number` | `200` | 进入视口后需稳定停留的时长（毫秒），到时才放行加载 |
| `maxWaitMs` | `number` | `1200` | 最长等待上限，避免快速来回一直不加载（饥饿保护） |
| `onlyWhenIntersecting` | `boolean` | `true` | 仅在进入视口时门控；若离开且未达 maxWaitMs 则中止本次加载 |
| `debug` | `boolean` | `false` | 是否输出调试日志 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onBeforeLoad` | 发起图片请求之前 | 返回 false 可阻断本次加载（如权限校验、占位策略） |
| `onEnterViewport` | 元素进入视口（IntersectionObserver） | 触发懒加载、开始请求、曝光上报 |
| `onLeaveViewport` | 元素离开视口 | 暂停 / 中止在途请求、回收资源 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ViewportDwellPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `dwellMs` | `number` | `250` | 需要在视口中持续停留的时间（毫秒），不足视为「划过」不加载 |
| `maxWaitMs` | `number` | `1500` | 最长等待时间（毫秒），超时仍允许加载以防饥饿 |
| `onlyWhenIntersecting` | `boolean` | `true` | 仅在进入视口时应用驻留判断；离开且未达上限则中止 |
| `debug` | `boolean` | `false` | 是否输出调试日志 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onBeforeLoad` | 发起图片请求之前 | 返回 false 可阻断本次加载（如权限校验、占位策略） |
| `onEnterViewport` | 元素进入视口（IntersectionObserver） | 触发懒加载、开始请求、曝光上报 |
| `onLeaveViewport` | 元素离开视口 | 暂停 / 中止在途请求、回收资源 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### WatermarkPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string \| ((src: string) => string)` | `© 2024 Vane` | 水印文本；可传函数按 src 动态生成 |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "center"` | `bottom-right` | 水印位置 |
| `opacity` | `number` | `0.8` | 0~1 透明度 |
| `fontSize` | `number` | `12` | px 字号 |
| `color` | `string` | `#fff` | 文字颜色 |
| `offsetX` | `number` | `8` | px 水平偏移 |
| `offsetY` | `number` | `8` | px 垂直偏移 |
| `zIndex` | `number` | `2` | 层叠顺序 |
| `enabled` | `boolean` | `true` | 是否启用 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在图片容器之上 | 骨架屏、错误占位、水印、加载动画 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### WebPPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 |
| `rewrite` | `(src, ctx) => string \| undefined` | `undefined` | 自定义重写函数：返回 webp 链接 |
| `replaceExtensions` | `string[]` | `["jpg", "jpeg", "png"]` | 需替换为 .webp 的扩展名 |
| `appendQueryParam` | `string` | `undefined` | 追加的查询参数，如 "format=webp" |
| `onDomains` | `string[]` | `[]（不限制）` | 限定生效域名 |
| `testSupport` | `boolean` | `true` | 运行前检测浏览器是否支持 webp |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onLoad` | 加载流程开始、需要确定最终图片地址时 | 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址） |
| `onLoadError` | 加载失败（网络错误、解码失败、超时） | 返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ZoomControlPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `step` | `number` | `0.5` | 每步缩放增量 |
| `min` | `number` | `1` | 最小缩放 |
| `max` | `number` | `4` | 最大缩放 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `galleryToolbarArea` | 渲染图库工具栏时 | 缩放、下载、分享等图库级操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setZoom` | `ctx.setZoom(z: number): void` | 设置图库缩放比例（按钮式缩放控制的写入入口） |

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
