/**
 * 子路径入口 `vane-card/plugins` —— 插件系统本身：装配器 + 15 个钩子的类型 + 领域槽位。
 *
 * 什么时候用它：写**自己的**插件（只需要钩子类型与 withPlugins），
 * 不需要官方那 22 个插件实现，也不需要复合组件。
 *
 *   import { withPlugins, type CardPluginHooks } from "vane-card/plugins";
 */

export { withPlugins } from "./components/CardPlugin/plugins";
export { BusKeys } from "./components/CardPlugin/plugins";
export type { BusKey } from "./components/CardPlugin/plugins";
export { usePluginSlot, renderDomainSlot, CardSlotProvider } from "./components/CardPlugin/plugins";

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
  PluginBus,
} from "./components/CardPlugin/plugins";
