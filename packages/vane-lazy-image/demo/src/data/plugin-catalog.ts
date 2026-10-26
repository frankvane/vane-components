// 插件目录（新版应用数据层）
// 动态加载包内 73 个插件的 doc.json，并按新版菜单分组（电商核心 / 视觉效果与交互 / 视觉与效果 /
// 性能与网络 / 稳健性与错误处理 / 视口与交互 / 可访问性与SEO / 其他）做显式映射。
// 工厂通过 doc.name 推导：create${doc.name}，在 PluginPreview 中实时调用。

import * as VL from "vane-lazy-image";

export type Category =
  | "ecommerce"
  | "interaction"
  | "visual"
  | "perf"
  | "robust"
  | "viewport"
  | "a11y"
  | "other";

export const CATEGORY_LABELS: Record<Category, string> = {
  ecommerce: "电商核心",
  interaction: "视觉效果与交互",
  visual: "视觉与效果",
  perf: "性能与网络",
  robust: "稳健性与错误处理",
  viewport: "视口与交互",
  a11y: "可访问性与 SEO",
  other: "其他",
};

// 显式分组 + 中文展示名（key = 插件目录名，即 doc.name）
const META: Record<string, { category: Category; title: string }> = {
  // 电商核心
  PriceTagPlugin: { category: "ecommerce", title: "价格标签" },
  PromoBadgePlugin: { category: "ecommerce", title: "促销徽标" },
  InventoryStatusPlugin: { category: "ecommerce", title: "库存状态" },
  ColorSwatchPlugin: { category: "ecommerce", title: "颜色样本" },
  SocialSharePlugin: { category: "ecommerce", title: "社交分享" },
  VideoPosterPlugin: { category: "ecommerce", title: "视频封面" },
  LocalizationPlugin: { category: "ecommerce", title: "本地化" },
  DownloadButtonPlugin: { category: "ecommerce", title: "下载按钮" },
  // 视觉效果与交互
  RevealAnimationPlugin: { category: "interaction", title: "揭示动画" },
  GlitchEffectPlugin: { category: "interaction", title: "故障特效" },
  MorphPlugin: { category: "interaction", title: "形变" },
  AnimatedCursorPlugin: { category: "interaction", title: "动态光标" },
  DepthMapPlugin: { category: "interaction", title: "深度图 (3D)" },
  // 视觉与效果
  SkeletonPlugin: { category: "visual", title: "骨架屏" },
  BorderGlowPlugin: { category: "visual", title: "边框辉光" },
  CaptionPlugin: { category: "visual", title: "图片说明" },
  FilterPlugin: { category: "visual", title: "滤镜" },
  GalleryPlugin: { category: "visual", title: "画廊" },
  OverlayInfoPlugin: { category: "visual", title: "信息蒙层" },
  ProgressOverlayPlugin: { category: "visual", title: "进度蒙层" },
  BlurUpPlugin: { category: "visual", title: "模糊渐显" },
  FadeInPlugin: { category: "visual", title: "淡入" },
  TransitionPlugin: { category: "visual", title: "过渡" },
  ParallaxPlugin: { category: "visual", title: "视差" },
  ColorExtractionPlugin: { category: "visual", title: "色彩提取" },
  RedactionPlugin: { category: "visual", title: "打码" },
  HoverZoomPlugin: { category: "visual", title: "悬停放大" },
  WatermarkPlugin: { category: "visual", title: "水印" },
  CustomEffectsPlugin: { category: "visual", title: "自定义效果" },
  // 性能与网络
  PreconnectPlugin: { category: "perf", title: "预连接" },
  PriorityLoadingPlugin: { category: "perf", title: "优先级加载" },
  CachePrewarmPlugin: { category: "perf", title: "缓存预热" },
  CacheMemoryPlugin: { category: "perf", title: "内存缓存" },
  CacheIDBPlugin: { category: "perf", title: "IndexedDB 缓存" },
  ConcurrencyControlPlugin: { category: "perf", title: "并发控制" },
  ScrollIdlePlugin: { category: "perf", title: "滚动空闲" },
  NetworkAnalyticsPlugin: { category: "perf", title: "网络分析" },
  PredictiveLoadingPlugin: { category: "perf", title: "预测加载" },
  DataSaverPlugin: { category: "perf", title: "省流量" },
  ImageOptimizationPlugin: { category: "perf", title: "图片优化" },
  FetchLoaderPlugin: { category: "perf", title: "Fetch 加载" },
  // 稳健性与错误处理
  ErrorBadgePlugin: { category: "robust", title: "错误徽标" },
  ErrorOverlayPlugin: { category: "robust", title: "错误蒙层" },
  FallbackImagePlugin: { category: "robust", title: "兜底图" },
  RetryOnErrorPlugin: { category: "robust", title: "失败重试" },
  ErrorTrackingPlugin: { category: "robust", title: "错误追踪" },
  OfflinePlugin: { category: "robust", title: "离线" },
  MemoryPressureAbortPlugin: { category: "robust", title: "内存压力中止" },
  DecodeAfterIdlePlugin: { category: "robust", title: "空闲解码" },
  AntiHotlinkPlugin: { category: "robust", title: "防盗链" },
  CDNFallbackPlugin: { category: "robust", title: "CDN 回退" },
  AuthPlugin: { category: "robust", title: "鉴权" },
  // 视口与交互
  ViewportAwarePlugin: { category: "viewport", title: "视口感知" },
  ViewportDebouncePlugin: { category: "viewport", title: "视口防抖" },
  ViewportDwellPlugin: { category: "viewport", title: "视口驻留" },
  HoverPrefetchPlugin: { category: "viewport", title: "悬停预取" },
  UserBehaviorPlugin: { category: "viewport", title: "用户行为" },
  // 可访问性与 SEO
  A11yPlugin: { category: "a11y", title: "无障碍" },
  AltTextPlugin: { category: "a11y", title: "替代文本" },
  ExifOrientationPlugin: { category: "a11y", title: "EXIF 方向" },
  AspectRatioSpacerPlugin: { category: "a11y", title: "宽高比占位" },
  ResponsivePlugin: { category: "a11y", title: "响应式" },
  SEOPlugin: { category: "a11y", title: "SEO" },
  // 其他
  BadgePlugin: { category: "other", title: "徽标" },
  DominantColorPlugin: { category: "other", title: "主色" },
  EventLoggerPlugin: { category: "other", title: "事件日志" },
  LQIPPlugin: { category: "other", title: "LQIP 低清预览" },
  PerformanceMonitorPlugin: { category: "other", title: "性能监控" },
  AdaptiveQualityPlugin: { category: "other", title: "自适应质量" },
  BatteryAwarePlugin: { category: "other", title: "电量感知" },
  CropPlugin: { category: "other", title: "裁剪" },
  ComparisonPlugin: { category: "other", title: "对比" },
  SvgPlaceholderPlugin: { category: "other", title: "SVG 占位" },
  WebPPlugin: { category: "other", title: "WebP" },
};

export interface PluginExample {
  name: string;
  description?: string;
  src?: string;
  config?: Record<string, any>; // 单实例场景
  configs?: Record<string, any>[]; // 多实例场景（如多角标组合）
}

export interface PluginMeta {
  id: string; // kebab slug，用于 /plugin/:id
  dir: string; // 目录名 = doc.name
  title: string;
  category: Category;
  factoryName: string;
  example: string;
  description: string;
  tags: string[];
  config: Array<{ name: string; type: string; description: string }>;
  examples: PluginExample[];
  features: string[];
  useCases: string[];
  notes: string[];
}

function slugify(dir: string): string {
  return dir
    .replace(/Plugin$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

// 动态加载全部 doc.json（eager）
const docs = import.meta.glob("../../../src/custom-plugins/*/doc.json", {
  eager: true,
  import: "default",
}) as Record<string, any>;

export const PLUGINS: PluginMeta[] = Object.keys(docs)
  .map((key) => {
    const dir = key.split("/").slice(-2)[0]; // .../SkeletonPlugin/doc.json -> SkeletonPlugin
    const doc = docs[key];
    const meta = META[dir];
    if (!meta) return null;
    const factoryName = "create" + doc.name;
    return {
      id: slugify(dir),
      dir,
      title: meta.title,
      category: meta.category,
      factoryName,
      example: doc.example || "",
      description: doc.description || "",
      tags: doc.tags || [],
      config: doc.config || [],
      examples: doc.examples || [],
      features: doc.features || [],
      useCases: doc.useCases || [],
      notes: doc.notes || [],
    } as PluginMeta;
  })
  .filter(Boolean) as PluginMeta[];

// 按分组归并（保持 CATEGORY_LABELS 顺序）
export const PLUGINS_BY_CATEGORY: Record<Category, PluginMeta[]> = {
  ecommerce: [],
  interaction: [],
  visual: [],
  perf: [],
  robust: [],
  viewport: [],
  a11y: [],
  other: [],
};
for (const p of PLUGINS) PLUGINS_BY_CATEGORY[p.category].push(p);

export function getPluginById(id: string): PluginMeta | undefined {
  return PLUGINS.find((p) => p.id === id);
}

export function getPluginFactory(id: string): ((cfg?: any) => any) | undefined {
  const meta = getPluginById(id);
  if (!meta) return undefined;
  // 1) 快路径：create + doc.name
  const direct = (VL as any)[meta.factoryName];
  if (typeof direct === "function") return direct;
  // 2) 兜底：导出名不一定等于 create+doc.name（如 LQIPPlugin→createLqipPlugin、
  //    CacheIDBPlugin→createIDBCachePlugin、CacheMemoryPlugin→createMemoryCachePlugin），
  //    改为按各 creator 携带的 .meta.name 反查（与旧版工坊同一机制）。
  for (const key of Object.keys(VL)) {
    const fn = (VL as any)[key];
    if (typeof fn === "function" && fn.meta && fn.meta.name === meta.dir) {
      return fn;
    }
  }
  return undefined;
}

// 组合示例（从 combos/ 抢救，独立页面）
export interface ComboPlugin {
  name: string; // 插件展示名
  role: string; // 在本组合中的职责
}
export interface ComboMeta {
  id: string;
  title: string;
  description: string;
  component: string; // 懒加载组件名
  plugins: ComboPlugin[]; // 组合构成：本组合叠加了哪些插件
  code: string; // 装配源码：withPlugins(...) + 用法
}
export const COMBOS: ComboMeta[] = [
  {
    id: "error-resilience",
    title: "错误韧性组合",
    description: "错误覆盖层 + 徽标 + 兜底图 + 自动重试 + 事件日志，构建失败的优雅降级链路。",
    component: "ComboErrorResilienceDemo",
    plugins: [
      { name: "ErrorOverlay 错误覆盖层", role: "加载失败时显示重试遮罩，引导用户重试" },
      { name: "ErrorBadge 错误徽标", role: "角落错误标记，快速识别失败项" },
      { name: "FallbackImage 兜底图", role: "加载失败回退到占位图，避免空白" },
      { name: "RetryOnError 自动重试", role: "失败后按策略自动重连，提升成功率" },
      { name: "EventLogger 事件日志", role: "记录加载/错误事件，便于监控排查" },
    ],
    code: `import {
  LazyLoadImageCore,
  createErrorOverlayPlugin,
  createErrorBadgePlugin,
  createFallbackImagePlugin,
  createRetryOnErrorPlugin,
  createEventLoggerPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createErrorOverlayPlugin({ retryText: "重试" }),
  createErrorBadgePlugin({}),
  createFallbackImagePlugin({ fallbackSrc: "/404.jpg" }),
  createRetryOnErrorPlugin({ maxRetries: 1 }),
  createEventLoggerPlugin({ enabled: true }),
]);

// 用法
<LazyImage src="https://invalid.example.com/not-found.jpg" alt="错误触发示例" />`,
  },
  {
    id: "performance",
    title: "性能与网络组合",
    description: "预连接 + 加载优先级 + 自适应质量 + 图片优化，端到端加速图片加载。",
    component: "ComboPerformanceDemo",
    plugins: [
      { name: "Preconnect 预连接", role: "提前与图片域名建连，省去 DNS/TLS 往返" },
      { name: "PriorityLoading 优先级加载", role: "LCP 等关键图高优先级，避免被挤占" },
      { name: "AdaptiveQuality 自适应质量", role: "按网络/设备动态降质，省流量提速" },
      { name: "ImageOptimization 图片优化", role: "自动选择最优格式与尺寸" },
    ],
    code: `import {
  LazyLoadImageCore,
  createPreconnectPlugin,
  createPriorityLoadingPlugin,
  createAdaptiveQualityPlugin,
  createImageOptimizationPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createPreconnectPlugin({ domains: ["https://picsum.photos"] }),
  createPriorityLoadingPlugin({ priority: "high" }),
  createAdaptiveQualityPlugin({}),
  createImageOptimizationPlugin({}),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/perf-combo/800/600" alt="性能优化示例" />`,
  },
  {
    id: "visual-effects",
    title: "视觉与效果组合",
    description: "模糊渐显 + 淡入 + 边框辉光 + 图片说明 + 水印，叠加出精致视觉层次。",
    component: "ComboVisualEffectsDemo",
    plugins: [
      { name: "BlurUp 模糊渐显", role: "低清模糊图过渡到清晰大图" },
      { name: "FadeIn 淡入", role: "加载完成平滑淡入" },
      { name: "BorderGlow 边框辉光", role: "聚焦时边框发光，突出主体" },
      { name: "Caption 图片说明", role: "底部说明文字，补充语境" },
      { name: "Watermark 水印", role: "右下角水印，版权标识" },
    ],
    code: `import {
  LazyLoadImageCore,
  createBlurUpPlugin,
  createFadeInPlugin,
  createBorderGlowPlugin,
  createCaptionPlugin,
  createWatermarkPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createBlurUpPlugin({ startBlur: 6, endBlur: 0, durationMs: 450 }),
  createFadeInPlugin({ durationMs: 450 }),
  createBorderGlowPlugin({}),
  createCaptionPlugin({ text: "组合示例：视觉与效果" }),
  createWatermarkPlugin({ text: "DEMO", position: "bottom-right", opacity: 0.6 }),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/visual-combo/800/600" alt="视觉效果示例" />`,
  },
  {
    id: "cache-storage",
    title: "缓存与存储组合",
    description: "内存 + IndexedDB + 视口预热，构建多级缓存降低重复请求。",
    component: "ComboCacheDemo",
    plugins: [
      { name: "MemoryCache 内存缓存", role: "最快命中，首屏零网络" },
      { name: "IDBCache IndexedDB 缓存", role: "跨会话持久，重启仍命中" },
      { name: "CachePrewarm 缓存预热", role: "进入视口即预取，滚动无等待" },
    ],
    code: `import {
  LazyLoadImageCore,
  createMemoryCachePlugin,
  createIDBCachePlugin,
  createCachePrewarmPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createMemoryCachePlugin({ maxEntries: 200 }),
  createIDBCachePlugin({}),
  createCachePrewarmPlugin({ trigger: "enter", preferMemory: true }),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/cache-combo/800/600" alt="缓存组合示例" />`,
  },
  {
    id: "viewport-interaction",
    title: "视口与交互组合",
    description: "视口感知 + 视口防抖 + 悬停预取 + 滚动空闲，协同控制加载时机。",
    component: "ComboViewportInteractionDemo",
    plugins: [
      { name: "ViewportAware 视口感知", role: "进入视口才真正加载" },
      { name: "ViewportDebounce 视口防抖", role: "抑制滚动抖动，避免频繁触发" },
      { name: "HoverPrefetch 悬停预取", role: "鼠标悬停提前拉取，零延迟" },
      { name: "ScrollIdle 滚动空闲", role: "页面空闲后再补加载，不抢主线程" },
    ],
    code: `import {
  LazyLoadImageCore,
  createViewportAwarePlugin,
  createViewportDebouncePlugin,
  createHoverPrefetchPlugin,
  createScrollIdlePlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createViewportAwarePlugin({}),
  createViewportDebouncePlugin({}),
  createHoverPrefetchPlugin({}),
  createScrollIdlePlugin({}),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/viewport-combo/800/600" alt="视口交互示例" />`,
  },
  {
    id: "a11y-seo",
    title: "可访问性与 SEO 组合",
    description: "可访问性 + SEO + 宽高比占位 + 响应式 + WebP + 替代文本，提升页面质量。",
    component: "ComboA11ySeoDemo",
    plugins: [
      { name: "A11y 可访问性", role: "补全无障碍属性，适配读屏" },
      { name: "SEO", role: "注入结构化 SEO 属性" },
      { name: "AspectRatioSpacer 宽高比占位", role: "预留宽高，杜绝布局抖动" },
      { name: "Responsive 响应式", role: "srcset 多尺寸自适应屏幕" },
      { name: "WebP", role: "优先 WebP，体积更小" },
      { name: "AltText 替代文本", role: "自动补全 alt，利于读屏与 SEO" },
    ],
    code: `import {
  LazyLoadImageCore,
  createA11yPlugin,
  createSEOPlugin,
  createAspectRatioSpacerPlugin,
  createResponsivePlugin,
  createWebPPlugin,
  createAltTextPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createA11yPlugin({}),
  createSEOPlugin({}),
  createAspectRatioSpacerPlugin({ ratio: 4 / 3 }),
  createResponsivePlugin({}),
  createWebPPlugin({}),
  createAltTextPlugin({ prefix: "Demo" }),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/a11y-seo-combo/800/600" alt="可访问性与 SEO 组合示例" />`,
  },
  {
    id: "visual-effects-plus",
    title: "视觉增强 Plus",
    description: "SVG 占位 + Blur-Up + Skeleton + 滤镜 + 悬停放大 + 辉光 + 说明 + 画廊灯箱，重负载视觉叠加。",
    component: "ComboVisualEffectsPlusDemo",
    plugins: [
      { name: "SvgPlaceholder SVG 占位", role: "动画 SVG 骨架，加载前即可见" },
      { name: "BlurUp 模糊渐显", role: "模糊到清晰过渡" },
      { name: "Skeleton 骨架屏", role: "shimmer 占位，提示加载中" },
      { name: "Filter 滤镜", role: "悬停灰度滤镜，焦点突出" },
      { name: "HoverZoom 悬停放大", role: "悬停轻微放大，增强交互" },
      { name: "BorderGlow 边框辉光", role: "边框发光，强调主体" },
      { name: "Caption 图片说明", role: "底部说明文字" },
      { name: "Gallery 画廊", role: "点击灯箱预览大图" },
    ],
    code: `import {
  LazyLoadImageCore,
  createSvgPlaceholderPlugin,
  createBlurUpPlugin,
  createSkeletonPlugin,
  createFilterPlugin,
  createHoverZoomPlugin,
  createBorderGlowPlugin,
  createCaptionPlugin,
  createGalleryPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createSvgPlaceholderPlugin({ svgContent: "<svg>…</svg>", background: "transparent", showWhen: "loading", fadeOutOnLoaded: true }),
  createBlurUpPlugin({ startBlur: 8, endBlur: 0, durationMs: 450 }),
  createSkeletonPlugin({ type: "shimmer", showWhen: "loading", borderRadius: 8, zIndex: 1 }),
  createFilterPlugin({ filter: "grayscale", amount: 1, hover: true }),
  createHoverZoomPlugin({ scale: 1.12, durationMs: 180 }),
  createBorderGlowPlugin({ color: "rgba(0,153,255,0.6)", blurPx: 12, spreadPx: 2 }),
  createCaptionPlugin({ text: "视觉增强组合（Plus）", position: "bottom" }),
  createGalleryPlugin({ buttonText: "Open", enableLightbox: true }),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/visual-plus/800/600" alt="视觉效果 Plus 示例" />`,
  },
  {
    id: "responsive-seo-webp",
    title: "响应式 + SEO + WebP",
    description: "响应式 srcset + WebP 优先 + SEO/LCP 优化 + 宽高比占位 + 模糊渐显，兼顾体验与排名。",
    component: "ComboResponsiveSeoWebPDemo",
    plugins: [
      { name: "Responsive 响应式", role: "按视口下发多尺寸 srcset" },
      { name: "WebP", role: "浏览器支持时优先 WebP" },
      { name: "SEO", role: "LCP 标记 + preload，提升排名" },
      { name: "AspectRatioSpacer 宽高比占位", role: "预留宽高，防抖动" },
      { name: "Caption 图片说明", role: "底部说明文字" },
      { name: "BlurUp 模糊渐显", role: "模糊到清晰过渡" },
    ],
    code: `import {
  LazyLoadImageCore,
  createResponsivePlugin,
  createWebPPlugin,
  createSEOPlugin,
  createAspectRatioSpacerPlugin,
  createCaptionPlugin,
  createBlurUpPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createResponsivePlugin({ variants: [{ width: 400 }, { width: 800 }, { width: 1200 }], sizes: "(max-width: 800px) 100vw, 800px" }),
  createWebPPlugin({ replaceExtensions: ["jpg", "jpeg", "png"], testSupport: true }),
  createSEOPlugin({ altFallback: "示例图片", priority: "lcp", preload: true, title: "演示图像" }),
  createAspectRatioSpacerPlugin({ ratio: 4 / 3 }),
  createCaptionPlugin({ text: "响应式 + WebP + SEO 组合" }),
  createBlurUpPlugin({ startBlur: 8, endBlur: 0, durationMs: 450 }),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/responsive-combo/800/600" alt="响应式 SEO WebP 组合示例" />`,
  },
  {
    id: "engine-perf",
    title: "性能优化综合（引擎层）",
    description: "离线降级 + 预连接 + 缓存预热 + 优先级加载，串成端到端链路，并实时展示 GlobalContext 在线/离线与 ObserverPool 共享。",
    component: "ComboEnginePerfDemo",
    plugins: [
      { name: "Offline 离线降级", role: "由 GlobalContext online/offline 驱动徽标与缓存回退" },
      { name: "Preconnect 预连接", role: "提前与图片域名建连，省 DNS/TLS 往返" },
      { name: "CachePrewarm 缓存预热", role: "进入视口即预取，滚动无等待" },
      { name: "PriorityLoading 优先级加载", role: "关键图高优先级，避免被挤占" },
    ],
    code: `import {
  LazyLoadImageCore,
  createOfflinePlugin,
  createPreconnectPlugin,
  createCachePrewarmPlugin,
  createPriorityLoadingPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createOfflinePlugin({ showBadge: true }),
  createPreconnectPlugin({ domains: ["https://picsum.photos"], showBadge: true }),
  createCachePrewarmPlugin({ trigger: "enter", showBadge: true }),
  createPriorityLoadingPlugin({ priority: "high" }),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/engine-perf/800/600" alt="性能优化综合示例" />
// 在 DevTools → Network 勾选 Offline，离线徽标会即时出现（GlobalContext online/offline 驱动）`,
  },
  {
    id: "interaction-overlay",
    title: "交互与叠层组合",
    description: "视口感知 + 防抖 + 悬停预取 + 滚动空闲 + 进度蒙层 + 信息蒙层 + 骨架，强化交互与反馈。",
    component: "ComboInteractionOverlayDemo",
    plugins: [
      { name: "ViewportAware 视口感知", role: "进入视口才加载" },
      { name: "ViewportDebounce 视口防抖", role: "抑制滚动抖动" },
      { name: "HoverPrefetch 悬停预取", role: "悬停预拉取下一张" },
      { name: "ScrollIdle 滚动空闲", role: "空闲后补加载" },
      { name: "ProgressOverlay 进度蒙层", role: "加载进度条与百分比" },
      { name: "OverlayInfo 信息蒙层", role: "底部信息条，展示来源" },
      { name: "Skeleton 骨架屏", role: "shimmer 占位，提示加载中" },
    ],
    code: `import {
  LazyLoadImageCore,
  createViewportAwarePlugin,
  createViewportDebouncePlugin,
  createHoverPrefetchPlugin,
  createScrollIdlePlugin,
  createProgressOverlayPlugin,
  createOverlayInfoPlugin,
  createSkeletonPlugin,
  withPlugins,
} from "vane-lazy-image";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createViewportAwarePlugin(),
  createViewportDebouncePlugin({ debounceMs: 160 }),
  createHoverPrefetchPlugin({ target: "container", trigger: "mouseenter", as: "image", max: 1, dedupe: true, getNextSrc: (ctx) => ctx.src }),
  createScrollIdlePlugin({ idleMs: 160, maxWaitMs: 1200, onlyWhenIntersecting: true }),
  createProgressOverlayPlugin({ showWhen: "loading", height: 3, color: "#4a90e2", showPercentText: true }),
  createOverlayInfoPlugin({ content: (ctx) => \`Interact • \${new URL(ctx.src, window.location.origin).pathname}\`, position: "bottom", background: "rgba(0,0,0,0.35)", color: "#fff", showWhen: "loading", zIndex: 4 }),
  createSkeletonPlugin({ type: "shimmer", showWhen: "loading", borderRadius: 6, zIndex: 1 }),
]);

// 用法
<LazyImage src="https://picsum.photos/seed/interaction-combo/800/600" alt="交互与叠层组合示例" />`,
  },
];

// 高级功能（从 advanced/ 抢救）
export interface AdvancedMeta {
  id: string;
  title: string;
  description: string;
  component: string;
}
export const ADVANCED: AdvancedMeta[] = [
  { id: "plugin-sandbox", title: "插件沙箱", description: "自包含 try/catch 沙箱隔离插件钩子执行。", component: "PluginSandboxDemo" },
  { id: "performance-monitoring", title: "性能监控系统", description: "全局性能监控与报告。", component: "PerformanceMonitoringDemo" },
  { id: "engine-infra", title: "引擎性能基础设施", description: "GlobalContext 全局上下文 + ObserverPool 共享观察池的实时可观察面板。", component: "EngineInfraDemo" },
  { id: "plugin-hot-reload", title: "插件热更新", description: "运行时注册 / 注销插件。", component: "PluginHotReloadDemo" },
  { id: "dependency-resolver", title: "依赖解析器", description: "拓扑排序 / 环检测 / 冲突校验。", component: "DependencyResolverDemo" },
];
