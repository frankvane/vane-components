export { default as ResumeCore } from "./ResumeCore";
export { withResumePlugins } from "./withPlugins";
export { ResumeSlotProvider } from "./plugins/ResumeSlotProvider";
export {
  renderResumeSlot,
  resolveResumeContentSlot,
  useResumeSlot,
  useResumeContentSlot,
  useResumeContext,
} from "./plugins/slots";
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
} from "./plugins/types";

export { DEFAULT_SECTION_ORDER } from "./plugins/types";
