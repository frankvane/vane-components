/**
 * vane-waterfall 主入口
 * 只导出「核心 + 装配 + 类型」，保持默认导入体积最小；
 * 插件请走子路径 `vane-waterfall/custom-plugins/<XxxPlugin>` 或 `vane-waterfall/plugins`。
 */
export { default as WaterfallCore } from "./components/WaterfallPlugin/WaterfallCore";
export type {
  WaterfallCoreProps,
  WaterfallCoreRef,
  ScrollToItemOptions,
  ScrollToOptions,
} from "./components/WaterfallPlugin/WaterfallCore";

export { withPlugins } from "./components/WaterfallPlugin/withPlugins";
export type { WithPluginsConfig } from "./components/WaterfallPlugin/withPlugins";

export type {
  ItemPosition,
  ItemVisibility,
  LayoutInfo,
  ViewportInfo,
  WaterfallPlugin,
  WaterfallPluginCreator,
  WaterfallPluginContext,
  WaterfallPluginHooks,
} from "./components/WaterfallPlugin/plugins/types";

export { computeLayout } from "./components/WaterfallPlugin/layout";
export type { AlignmentMode } from "./components/WaterfallPlugin/layout";
export { computeVisibleRange } from "./components/WaterfallPlugin/virtualize";
export type { VirtualizeOptions, VisibleRange } from "./components/WaterfallPlugin/virtualize";

// 内核类型（跨包同一套，避免用户装两个版本的类型）
export type { Plugin, PluginContext, PluginDoc } from "@vane/plugin-core";
