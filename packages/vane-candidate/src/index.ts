/**
 * vane-candidate 主入口
 * 只导出「核心 + 装配 + 领域槽/上下文 + 类型」，保持默认导入体积最小。
 * 插件走子路径 vane-candidate/custom-plugins/<Name>（ADR-6 严格）。
 */

// ===== Core + 插件系统 =====
export { default as CandidateCore } from "./components/CandidatePlugin/CandidateCore";
// 公开装配 API：withPlugins 是 withCandidatePlugins 的别名（与 README / docs 一致）。
// 内核通用版 withPlugins 不做领域槽装配，若从这里导出会让按文档接入的宿主「插件全部失效」。
export {
  withCandidatePlugins,
  withCandidatePlugins as withPlugins,
} from "./components/CandidatePlugin/withPlugins";
export {
  CandidateSlotProvider,
  renderCandidateSlot,
  resolveCandidateContentSlot,
  useCandidateSlot,
  useCandidateCardSlot,
  useCandidateColumnSlot,
  useCandidateContentSlot,
  useCandidateContext,
} from "./components/CandidatePlugin/plugins/slots";
export {
  stageIndexOf,
  moveStage,
  withHistory,
  applyCandidatePatch,
  csvCell,
  maskPhone,
  maskEmail,
} from "./components/CandidatePlugin/domain";

// ===== 领域类型 + 复用内核类型（避免消费方重复依赖 vane-plugin-core 取类型）=====
export type {
  CandidateCoreProps,
  CandidateCoreRef,
  CandidatePlugin,
  CandidatePluginContext,
  CandidatePluginHooks,
  CandidatePluginCreator,
  CandidateSlotName,
  CandidateContentSlotName,
  Candidate,
  CandidateNote,
  CandidateHistoryItem,
  CandidateInterview,
  CandidateOffer,
  StageConfig,
  StageTone,
  PluginDoc,
  PluginBus,
} from "./components/CandidatePlugin/plugins/types";

export { DEFAULT_STAGES } from "./components/CandidatePlugin/plugins/types";

export type { WithPluginsConfig } from "vane-plugin-core";
export type {
  Plugin,
  PluginHooks,
  PluginContext,
  PluginCreator,
  PluginManager,
} from "vane-plugin-core";
