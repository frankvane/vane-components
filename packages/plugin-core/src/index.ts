/**
 * @vane/plugin-core — vane 插件式组件共用内核
 * 只依赖 react（peer），不依赖 react-dom，核心 gzip < 3KB。
 */

// 类型（Vane Plugin Spec）
export type {
  Plugin,
  PluginHooks,
  PluginContext,
  PluginRefs,
  PluginBus,
  PluginLogger,
  PluginManager,
  PluginCreator,
  PluginDoc,
  PluginDocConfigItem,
  DeviceInfo,
  WithPluginsConfig,
} from "./types";

// 总线
export { createPluginBus } from "./bus/PluginBus";

// 管理器
export { createPluginManager, type PluginManagerOptions } from "./manager/PluginManager";

// 依赖解析
export { resolveDependencyOrder, type DepNode } from "./dependency/DependencyResolver";

// 沙箱
export { runHookInSandbox, type SandboxOptions } from "./sandbox/PluginSandbox";
export { PluginErrorBoundary } from "./sandbox/PluginErrorBoundary";

// React 装配层
export {
  withPlugins,
  usePluginRuntime,
  usePluginBus,
  usePluginContext,
  PluginRuntimeProvider,
  renderPluginSlot,
  composeSlots,
  type PluginRuntime,
  type UsePluginRuntimeOptions,
  type SlotOptions,
  type SlotHookName,
} from "./react";

// 工具
export { detectDevice, resetDeviceCache } from "./utils/detectDevice";
