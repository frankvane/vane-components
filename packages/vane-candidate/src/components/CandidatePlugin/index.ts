export { default as CandidateCore } from "./CandidateCore";
export {
  withCandidatePlugins,
  withCandidatePlugins as withPlugins,
} from "./withPlugins";
export { CandidateSlotProvider } from "./plugins/CandidateSlotProvider";
export {
  renderCandidateSlot,
  resolveCandidateContentSlot,
  useCandidateSlot,
  useCandidateCardSlot,
  useCandidateColumnSlot,
  useCandidateContentSlot,
  useCandidateContext,
} from "./plugins/slots";
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
} from "./plugins/types";

// DEFAULT_STAGES 是运行期常量（不是类型），须用值导出，否则消费方拿到 undefined。
export { DEFAULT_STAGES } from "./plugins/types";
export {
  stageIndexOf,
  moveStage,
  withHistory,
  applyCandidatePatch,
  csvCell,
  maskPhone,
  maskEmail,
} from "./domain";
