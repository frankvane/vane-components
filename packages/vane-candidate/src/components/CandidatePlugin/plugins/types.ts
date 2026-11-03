import type React from "react";
import type {
  PluginContext,
  PluginHooks,
  Plugin,
  PluginDoc,
  PluginBus,
} from "vane-plugin-core";

/**
 * vane-candidate 领域类型层。
 * 内核 vane-plugin-core 提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「候选人流水线领域」的差异：候选人/阶段数据模型 + 领域槽 + 领域上下文。
 */

// ============ 数据模型 ============

export interface CandidateNote {
  id: string;
  author: string;
  at: string;
  text: string;
}

export interface CandidateHistoryItem {
  at: string;
  action: string;
  detail?: string;
}

export interface CandidateInterview {
  /** ISO 日期或 "MM-DD HH:mm" 等展示文本 */
  date: string;
  interviewer?: string;
  mode?: "onsite" | "video" | "phone";
}

export interface CandidateOffer {
  salary?: string;
  status: "draft" | "sent" | "accepted" | "declined";
}

export interface Candidate {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  /** 当前阶段 key（对应 StageConfig.key） */
  stage: string;
  /** 岗位匹配分 0-100 */
  score?: number;
  tags?: string[];
  source?: string;
  appliedAt?: string;
  email?: string;
  phone?: string;
  summary?: string;
  resumeUrl?: string;
  starred?: boolean;
  archived?: boolean;
  interview?: CandidateInterview;
  offer?: CandidateOffer;
  history?: CandidateHistoryItem[];
  notes?: CandidateNote[];
}

export type StageTone = "neutral" | "info" | "warn" | "good" | "bad";

export interface StageConfig {
  key: string;
  label: string;
  tone?: StageTone;
}

export const DEFAULT_STAGES: readonly StageConfig[] = Object.freeze([
  { key: "applied", label: "已投递", tone: "neutral" },
  { key: "screening", label: "筛选中", tone: "info" },
  { key: "interview", label: "面试中", tone: "warn" },
  { key: "offer", label: "Offer", tone: "good" },
  { key: "hired", label: "已入职", tone: "good" },
  { key: "rejected", label: "已婉拒", tone: "bad" },
]);

// ============ 核心组件 props / ref ============

export interface CandidateCoreProps<T = Candidate> {
  /** 候选人列表（透传给内核 context.data，并经 transformData 链改写） */
  data?: T[];
  /** 阶段定义（看板列顺序） */
  stages?: StageConfig[];
  /** 外部注入子节点（渲染在浮层兜底层） */
  children?: React.ReactNode;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  /** 插件流转/更新候选人后回调整份列表（宿主持久化入口；同时广播 bus candidate:change） */
  onDataChange?: (data: T[]) => void;
  debug?: boolean;
  /** 由 withCandidatePlugins 注入，插件通过 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
}

export interface CandidateCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
  getStageKeys: () => string[];
}

// ============ 领域上下文扩展 ============

/**
 * 领域动作：插件经 withCandidatePlugins 注入的数据操作方法，
 * 内部走 bus 事件（candidate:update / candidate:batch-update / candidate:move /
 * candidate:batch-move），由装配层统一落内部态并广播 candidate:change 通知宿主。
 */
export interface CandidateDomainContext<T = Candidate> {
  /** 全量内部数据（transformData 管道之前、未过滤未脱敏）；人才库 / 判重等需要原始数据的场景用这个，而非 ctx.data */
  rawData?: T[];
  /** 局部更新某个候选人（浅合并 patch）；id 不存在时不触发任何回调 */
  updateCandidate: (id: string, patch: Partial<Candidate>) => void;
  /**
   * 批量局部更新：单次聚合落态，只广播一次 candidate:change / 触发一次 onDataChange。
   * 批量归档 / 批量打标等场景用这个，避免逐条 emit 造成宿主持久化风暴。
   */
  updateCandidates: (updates: Array<{ id: string; patch: Partial<Candidate> }>) => void;
  /** 阶段流转：delta=+1 推进 / -1 退回，越界即停在首/末阶段；自动追加 history */
  moveCandidate: (id: string, delta: number) => void;
  /**
   * 流转到指定阶段（自动追加 history）。与 moveCandidate(delta) 的差异：目标以
   * stage key 直接给定，避免「调用方与执行侧阶段表不一致时 delta 错位」。
   */
  moveCandidateTo: (id: string, targetStage: string) => void;
  /** 批量流转到指定阶段：单次聚合落态、只广播一次；自动逐条追加 history */
  moveCandidatesTo: (ids: string[], targetStage: string) => void;
}

export type CandidatePluginContext<T = Candidate> = PluginContext<
  CandidateCoreProps<T>,
  T[]
> &
  CandidateDomainContext<T>;

// ============ 插件钩子 ============

/**
 * 内核 9 钩子 + 候选人领域槽：
 *  - renderToolbar / renderFooter：全局装饰累积槽（多插件顺序拼接）
 *  - renderCardBadges / renderCardActions：per-card 装饰累积槽，签名 (ctx, candidate)
 *  - renderColumnHeader：per-stage 装饰累积槽，签名 (ctx, stage, count)
 *  - renderCards：整体内容覆盖槽（单值，最高 priority 且返回非 null 者胜出；
 *    返回 null 回落核心默认看板）
 *  - renderCardBody：per-card 内容覆盖槽（单值；默认=核心卡片正文）
 *
 * ⚠️ order 与 priority 的分工（容易混淆）：
 *  - config.order 只影响【渲染槽】内的插件排序（order 升序 → priority 降序）；
 *  - transformData 数据管线的执行顺序由【顶层 priority】决定（越大越先执行，
 *    内核 DependencyResolver：依赖约束 > priority 降序 > 注册顺序）。
 *  官方插件两者数值刻意保持一致；第三方插件若只想调整渲染位置请改 order，
 *  若要调整数据管线先后（如脱敏必须最后执行）必须同时调整 priority。
 */
export interface CandidatePluginHooks<T = Candidate>
  extends PluginHooks<CandidateCoreProps<T>, T[]> {
  /** 收窄 ctx：内核钩子为方法语法（双变），领域上下文可安全替换基础上下文 */
  transformData?(context: CandidatePluginContext<T>, data: T[]): T[];
  renderOverlay?(context: CandidatePluginContext<T>): React.ReactNode;
  renderToolbar?: (ctx: CandidatePluginContext<T>) => React.ReactNode;
  renderCardBadges?: (
    ctx: CandidatePluginContext<T>,
    candidate: T
  ) => React.ReactNode;
  renderCardActions?: (
    ctx: CandidatePluginContext<T>,
    candidate: T
  ) => React.ReactNode;
  renderCardBody?: (
    ctx: CandidatePluginContext<T>,
    candidate: T
  ) => React.ReactNode;
  renderCards?: (
    ctx: CandidatePluginContext<T>,
    payload: { stages: StageConfig[]; candidates: T[] }
  ) => React.ReactNode;
  renderColumnHeader?: (
    ctx: CandidatePluginContext<T>,
    stage: StageConfig,
    count: number
  ) => React.ReactNode;
  renderFooter?: (ctx: CandidatePluginContext<T>) => React.ReactNode;
}

/** 装饰累积槽（多插件拼接）名集合 */
export type CandidateSlotName =
  | "renderToolbar"
  | "renderFooter"
  | "renderCardBadges"
  | "renderCardActions"
  | "renderColumnHeader";

export const DECORATIVE_SLOTS: CandidateSlotName[] = [
  "renderToolbar",
  "renderFooter",
  "renderCardBadges",
  "renderCardActions",
  "renderColumnHeader",
];

/** 内容覆盖槽名集合（单值，最高 priority 胜出） */
export type CandidateContentSlotName = "renderCards" | "renderCardBody";

// ============ 插件定义 ============

export interface CandidatePlugin<T = Candidate>
  extends Plugin<CandidateCoreProps<T>, T[]> {
  hooks: CandidatePluginHooks<T>;
}

/**
 * 候选人插件工厂类型：返回领域接口 CandidatePlugin<T>（hooks 已收窄为领域签名），
 * 保证工厂内书写 renderCardBadges 等钩子时 ctx 推断正确。meta 用于文档与 demo 导航。
 */
export interface CandidatePluginCreator<
  Config = Record<string, unknown>,
  T = Candidate,
> {
  (config?: Config): CandidatePlugin<T>;
  meta: PluginDoc;
}

export type { PluginDoc, PluginBus };
