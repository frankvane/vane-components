/**
 * CardPlugin 插件系统入口（C2 · 接 @vane/plugin-core）
 */

// 类型导出
export type {
  CardPlugin,
  CardPluginContext,
  CardPluginHooks,
  PluginCreator,
  WithPluginsConfig,
  CardState,
  CardSize,
  DeviceInfo,
  AnimationConfig,
} from "./types";

// 事件总线类型（包内声明，不对外泄漏内核包名）
export type { PluginBus } from "./types";

// 功能导出
export { withPlugins } from "./withPlugins";
export { BusKeys } from "./BusKeys";
export type { BusKey } from "./BusKeys";
export { usePluginSlot, renderDomainSlot, CardSlotProvider } from "./slots";
export { setupForceUpdateOnBusKeys } from "./utils/busHelpers";
