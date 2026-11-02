/**
 * vane-modal-sheet 主入口
 * 只导出「核心 + 装配 + 契约类型」，保持默认导入体积最小（ADR-6：根不桶导出插件）。
 */
export { ModalSheetCore } from "./components/ModalSheetPlugin/ModalSheetCore";
export { withModalSheetPlugins } from "./components/ModalSheetPlugin/plugins/withPlugins";
export {
  resolveSnap,
  resolveSnapPixels,
  createSheetState,
} from "./components/ModalSheetPlugin/engine";
export type {
  SnapDecision,
  SnapDecisionInput,
  SheetDetent,
  SheetEngineState,
  SheetPhase,
} from "./components/ModalSheetPlugin/engine";
export type {
  ModalSheetCoreProps,
  ModalSheetCoreRef,
  ModalSheetDragProps,
  ModalSheetEngineCallbacks,
  ModalSheetPlugin,
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
  ModalSheetPluginHooks,
  ModalSheetWithPluginsConfig,
} from "./components/ModalSheetPlugin/plugins/types";

// 插件系统类型（来自共用内核；插件本体走 ./custom-plugins/<Name>Plugin 子路径）
export type { Plugin, PluginHooks, PluginContext, PluginCreator } from "vane-plugin-core";
