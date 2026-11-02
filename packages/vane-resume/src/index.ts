/**
 * vane-resume 主入口
 * 只导出「核心 + 装配 + 领域槽/上下文 + 类型」，保持默认导入体积最小。
 * 插件走子路径 vane-resume/custom-plugins/<Name>（ADR-6 严格）。
 */

// ===== Core + 插件系统 =====
export { default as ResumeCore } from "./components/ResumePlugin/ResumeCore";
// 公开装配 API：withPlugins 是 withResumePlugins 的别名（与 README / docs 一致）。
// 内核通用版 withPlugins 不做领域槽装配，若从这里导出会让按文档接入的宿主「插件全部失效」。
// 需要内核通用版的消费方可直接从 vane-plugin-core 导入。
export {
  withResumePlugins,
  withResumePlugins as withPlugins,
} from "./components/ResumePlugin/withPlugins";
export {
  ResumeSlotProvider,
  renderResumeSlot,
  resolveResumeContentSlot,
  useResumeSlot,
  useResumeContentSlot,
  useResumeContext,
} from "./components/ResumePlugin/plugins/slots";

// ===== 领域类型 + 复用内核类型（避免消费方重复依赖 vane-plugin-core 取类型）=====
export type {
  ResumeCoreProps,
  ResumeCoreRef,
  ResumePlugin,
  ResumePluginContext,
  ResumePluginHooks,
  ResumePluginCreator,
  ResumeSlotName,
  SectionKey,
  ResumeData,
  ContactItem,
  WorkItem,
  EduItem,
  SkillGroup,
  ProjectItem,
  AwardItem,
  LangItem,
  CertItem,
  AttachmentItem,
  PluginDoc,
  PluginBus,
} from "./components/ResumePlugin/plugins/types";

// DEFAULT_SECTION_ORDER 是运行期常量（不是类型），须用值导出，否则消费方拿到 undefined。
export { DEFAULT_SECTION_ORDER } from "./components/ResumePlugin/plugins/types";

export type { WithPluginsConfig } from "vane-plugin-core";
export type { Plugin, PluginHooks, PluginContext, PluginCreator, PluginManager } from "vane-plugin-core";
