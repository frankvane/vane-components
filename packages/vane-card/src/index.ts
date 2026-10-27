/**
 * vane-card 库入口文件（统一从 CardPlugin barrel 导出）
 * 外部使用只需从包根导入，避免深层路径耦合。
 */

// 统一导出 CardPlugin 的所有公共 API（包含 CardCore、插件系统、复合组件等）
export * from "./components/CardPlugin";

// 别名导出：withPlugins 同时以 withCardPlugins 暴露
export { withPlugins as withCardPlugins } from "./components/CardPlugin/plugins";
export { usePluginSlot, renderDomainSlot } from "./components/CardPlugin/plugins";

export type {
  PluginBus as CardPluginBus,
  PluginCreator as CardPluginCreator,
  WithPluginsConfig as CardWithPluginsConfig,
} from "./components/CardPlugin/plugins";
