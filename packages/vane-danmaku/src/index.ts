/**
 * vane-danmaku 主入口。
 * 只导出「核心 + 装配 + 契约类型」，插件走子路径 ./custom-plugins/<Name>Plugin（ADR-6）。
 */
export { DanmakuCore } from "./components/DanmakuPlugin/DanmakuCore";
export { withDanmakuPlugins } from "./components/DanmakuPlugin/withPlugins";
export { DanmakuScheduler, draw, measure } from "./components/DanmakuPlugin/render";
export type { RenderOptions, Active } from "./components/DanmakuPlugin/render";
export {
  DanmakuSlotProvider,
  useDanmakuSlot,
  useDanmakuContext,
} from "./components/DanmakuPlugin/plugins/slots";
export type {
  DanmakuCoreProps,
  DanmakuCoreRef,
  DanmakuData,
  DanmakuItem,
  DanmakuMeta,
  DanmakuMode,
  DanmakuCommand,
  DanmakuRenderHint,
  FanBadge,
  Rect,
  DanmakuPluginContext,
  DanmakuPluginHooks,
  DanmakuPlugin,
  DanmakuPluginCreator,
} from "./components/DanmakuPlugin/plugins/types";

// 插件系统（来自共用内核，附带领域化别名）
export { withPlugins } from "vane-plugin-core";
export type { Plugin, PluginHooks, PluginContext, PluginCreator } from "vane-plugin-core";
