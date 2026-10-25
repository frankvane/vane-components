/**
 * @module vane-lazy-image/plugins
 * 插件系统入口：领域装配（withPlugins）+ 领域类型 + 一等公民插件。
 * 通用插件能力（bus/manager/sandbox/slots）由 @vane/plugin-core 提供并在此转发。
 */

export { withPlugins } from "./components/LazyLoadImagePlugin/withPlugins";
export type { WithPluginsConfig } from "./components/LazyLoadImagePlugin/withPlugins";

// ---------- 领域类型 ----------
export type {
  LazyImagePlugin,
  LazyImagePluginCreator,
  LazyImageContext,
  LazyImageHooks,
  LazyImageData,
  LazyImageBusEvents,
  LazyImagePluginBus,
  ProgressInfo,
  NetworkInfo,
  Dimensions,
  InteractionType,
} from "./components/LazyLoadImagePlugin/plugins/types";

// ---------- 一等公民插件（完整清单见 custom-plugins 子路径） ----------
export { createFetchLoaderPlugin } from "./custom-plugins/FetchLoaderPlugin";
export type { FetchLoaderPluginConfig } from "./custom-plugins/FetchLoaderPlugin";
export { createBlurUpPlugin } from "./custom-plugins/BlurUpPlugin";
export type { BlurUpConfig } from "./custom-plugins/BlurUpPlugin";

// ---------- 内核能力转发（名称与旧版保持一致） ----------
export {
  createPluginBus,
  createPluginManager,
  resolveDependencyOrder,
  runHookInSandbox,
  PluginErrorBoundary,
  composeSlots,
  renderPluginSlot,
} from "@vane/plugin-core";
