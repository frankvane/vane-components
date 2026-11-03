/** ./core —— 只要核心组件时导入这里，体积最小 */
export { default as CandidateCore } from "../components/CandidatePlugin/CandidateCore";
export {
  withCandidatePlugins,
  withCandidatePlugins as withPlugins,
} from "../components/CandidatePlugin/withPlugins";
export type {
  CandidateCoreProps,
  CandidateCoreRef,
  Candidate,
  StageConfig,
} from "../components/CandidatePlugin/plugins/types";
export { DEFAULT_STAGES } from "../components/CandidatePlugin/plugins/types";
