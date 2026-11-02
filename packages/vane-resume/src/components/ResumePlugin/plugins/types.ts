import type React from "react";
import type {
  PluginContext,
  PluginHooks,
  Plugin,
  PluginCreator,
  PluginDoc,
  PluginBus,
} from "vane-plugin-core";

/**
 * vane-resume 领域类型层。
 * 内核 vane-plugin-core 提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「简历领域层」的差异：结构化数据模型 + 领域槽 + 领域上下文。
 */

// ============ 结构化数据模型 ============

export interface ContactItem {
  type: "phone" | "email" | "address" | "social";
  label: string;
  value: string;
  href?: string;
}

export interface WorkItem {
  id?: string;
  company: string;
  role: string;
  start: string;
  end: string;
  location?: string;
  highlights: string[];
}

export interface EduItem {
  id?: string;
  school: string;
  degree: string;
  major?: string;
  start: string;
  end: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ProjectItem {
  id?: string;
  name: string;
  role?: string;
  start?: string;
  end?: string;
  desc: string;
  links?: string[];
}

export interface AwardItem {
  id?: string;
  title: string;
  issuer: string;
  date?: string;
}

export interface LangItem {
  id?: string;
  name: string;
  level: string;
}

export interface CertItem {
  id?: string;
  name: string;
  issuer: string;
  date?: string;
}

export interface AttachmentItem {
  id?: string;
  name: string;
  kind: "pdf" | "image" | "link";
  url: string;
  size?: number;
}

export interface ResumeData {
  basics: {
    name: string;
    title: string;
    avatar?: string;
    summary?: string;
    location?: string;
    birthDate?: string;
    contacts: ContactItem[];
  };
  work: WorkItem[];
  education: EduItem[];
  skills: SkillGroup[];
  projects?: ProjectItem[];
  awards?: AwardItem[];
  languages?: LangItem[];
  certificates?: CertItem[];
  attachments?: AttachmentItem[];
}

export type SectionKey =
  | "basics"
  | "work"
  | "education"
  | "skills"
  | "projects"
  | "extra"
  | "attachments";

export const DEFAULT_SECTION_ORDER: readonly SectionKey[] = Object.freeze([
  "basics",
  "work",
  "education",
  "skills",
  "projects",
  "extra",
  "attachments",
]);

// ============ 核心组件 props / ref ============

export interface ResumeCoreProps<T = ResumeData> {
  /** 简历结构化数据（透传给内核 context.data，并经 transformData 链改写） */
  data?: T;
  /** 外部注入子节点（一般不用；核心自管分段渲染） */
  children?: React.ReactNode;
  /** 板块默认顺序（可被 SectionReorder 插件经 ctx.state 覆盖） */
  defaultSectionOrder?: SectionKey[];
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由 withResumePlugins 注入，插件通过 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
}

export interface ResumeCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
  getSectionOrder: () => SectionKey[];
}

// ============ 插件上下文 ============

/**
 * 简历插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里把 data 收窄为
 * 「经过 transformData 链之后」的数据（插件消费的就是这份），并保留通用字段。
 */
/**
 * 简历插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里只把 data 收窄为
 * 「经过 transformData 链之后」的数据（插件消费的就是这份）。
 * 注意：与内核保持一致，data 为 T | undefined（props.data 未传时），插件内部按需以
 * `ctx.data as ResumeData` 取用。不要在此把 data 收窄为必填，否则会破坏与内核
 * PluginContext 的结构兼容性，导致每个钩子的 ctx 推断失败（implicitly any）。
 */
export type ResumePluginContext<T = ResumeData> = PluginContext<ResumeCoreProps<T>, T>;

// ============ 插件钩子 ============

/**
 * 内核 9 钩子（onMount / onUnmount / onPropsChange / onError / transformProps /
 * transformData / renderOverlay / renderHeader / renderFooter）+ 简历领域 9 个渲染槽：
 *   renderToolbar / renderBasics（装饰累积：核心默认 + StatSummary 追加）
 *   renderWork / renderEducation / renderSkills / renderProjects / renderExtra（内容覆盖：默认 vs 插件）
 *   renderAttachments / renderFooter（装饰累积）
 *
 * 注意：renderWork 等内容槽是「单值覆盖」语义——最高 priority 且返回非 null 的插件
 * 胜出，否则由核心渲染默认结构。renderToolbar / renderBasics / renderAttachments /
 * renderFooter 是「装饰累积」语义——多插件输出顺序拼接。
 */
export interface ResumePluginHooks<T = ResumeData> extends PluginHooks<ResumeCoreProps<T>, T> {
  renderToolbar?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderBasics?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderWork?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderEducation?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderSkills?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderProjects?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderExtra?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderAttachments?: (ctx: ResumePluginContext<T>) => React.ReactNode;
  renderFooter?: (ctx: ResumePluginContext<T>) => React.ReactNode;
}

export type ResumeSlotName =
  | "renderToolbar"
  | "renderBasics"
  | "renderWork"
  | "renderEducation"
  | "renderSkills"
  | "renderProjects"
  | "renderExtra"
  | "renderAttachments"
  | "renderFooter";

/** 装饰累积槽（多插件拼接）vs 内容覆盖槽（单值，最高 priority 胜出） */
export const DECORATIVE_SLOTS: ResumeSlotName[] = [
  "renderToolbar",
  "renderBasics",
  "renderAttachments",
  "renderFooter",
];

// ============ 插件定义 ============

export interface ResumePlugin<T = ResumeData> extends Plugin<ResumeCoreProps<T>, T> {
  hooks: ResumePluginHooks<T>;
}

/**
 * 简历插件工厂类型。关键：返回类型是领域接口 ResumePlugin<T>（其 hooks 为
 * ResumePluginHooks<T>，领域槽的 ctx 已被收窄为 ResumePluginContext<T>），而非内核的
 * 基础 Plugin。这样在工厂内书写 onMount / renderToolbar / renderWork 等钩子时，ctx 会被
 * 正确推断为领域上下文，而不是因内核 PluginHooks 的索引签名 `[k:string]: unknown`
 * 而退化成 implicitly any。meta 字段用于文档生成与 demo 导航。
 */
export interface ResumePluginCreator<Config = any, T = ResumeData> {
  (config?: Config): ResumePlugin<T>;
  meta: PluginDoc;
}

export type { PluginDoc, PluginBus };
