/** ./core —— 只要核心组件时导入这里，体积最小 */
export { default as ResumeCore } from "../components/ResumePlugin/ResumeCore";
export {
  withResumePlugins,
  withResumePlugins as withPlugins,
} from "../components/ResumePlugin/withPlugins";
export type {
  ResumeCoreProps,
  ResumeCoreRef,
  ResumeData,
  SectionKey,
} from "../components/ResumePlugin/plugins/types";
