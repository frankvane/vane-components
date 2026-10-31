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
 * vane-sign-in 领域类型层。
 * 内核 vane-plugin-core 已提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「签到领域层」的差异。
 */

// ============ 领域数据 ============

/** 单日格状态 */
export type DayStatus = "signed" | "today" | "missed" | "future" | "reward";

/** 单日奖励 */
export interface RewardInfo {
  /** 第几天（1-based）的奖励 */
  day: number;
  kind: "points" | "coupon" | "gift" | "badge";
  /** 积分额 / 券面额等 */
  value?: number;
  label: string;
  /** 是否已领取 */
  claimed?: boolean;
}

/** 日历单格 */
export interface DayCell {
  /** ISO yyyy-mm-dd */
  date: string;
  day: number;
  status: DayStatus;
  reward?: RewardInfo;
  /** 漏签且仍在补签窗口内 */
  canMakeup?: boolean;
}

/** 补签配额 */
export interface MakeupInfo {
  available: number;
  used: number;
  max: number;
}

/** 会员等级 */
export interface LevelInfo {
  name: string;
  current: number;
  next: number;
  /** 0–1 进度 */
  progress: number;
}

/** 领取记录 */
export interface ClaimRecord {
  id: string;
  day: number;
  label: string;
  at: number;
}

/** 签到核心数据 */
export interface SignInData {
  todaySigned: boolean;
  streak: number;
  maxStreak: number;
  totalDays: number;
  points: number;
  calendar: DayCell[];
  rewards: RewardInfo[];
  makeup: MakeupInfo;
  nextResetAt?: number;
  level?: LevelInfo;
  rules?: string[];
  history?: ClaimRecord[];
}

/** 业务回调 */
export interface SignInCallbacks {
  sign?: () => void | Promise<void>;
  claim?: (day: number) => void | Promise<void>;
  makeup?: (date: string) => void | Promise<void>;
  share?: () => void;
  remind?: (enabled: boolean) => void;
  invite?: () => void;
}

// ============ 核心组件 props / ref ============

export interface SignInCoreProps {
  /** 签到数据（必填） */
  data: SignInData;
  /** 业务回调 */
  callbacks?: SignInCallbacks;
  /** 覆盖型子节点（renderOverlay 钩子链产物） */
  children?: React.ReactNode;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由 withSignInPlugins 注入，插件经 ctx.refs.container 拿到同一引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
}

export interface SignInCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
}

// ============ 插件上下文 ============

/**
 * 签到插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / forceUpdate / getSize / logger；这里把 data 收敛为领域视图
 * SignInData（基类 data 为可选泛型，领域覆盖为必填 SignInData），并补充 callbacks
 * （业务动作入口）。保持 data 必填，插件内 `ctx.data.streak` 等访问无需可空判断。
 */
export interface SignInPluginContext<T = any>
  extends PluginContext<SignInCoreProps, SignInData> {
  /** 签到数据（与 props.data 同源，必填） */
  data: SignInData;
  /** 业务回调集合 */
  callbacks: SignInCallbacks;
}

// ============ 插件钩子 ============

/**
 * 内核 9 钩子 + 签到领域 5 个结构化渲染槽（header / calendar / rewards / actions / footer）。
 * overlay 仍走内核 renderOverlay（经 withSignInPlugins 的 composeSlots 兜底）。
 * 钩子一律用「方法语法」声明，使内核把 context 收窄为领域上下文时通过 bivariance 校验
 * （strictFunctionTypes 下参数逆变会拒绝领域钩子赋值，见 vane-profile 同款约定）。
 */
export interface SignInPluginHooks<T = any>
  extends PluginHooks<SignInCoreProps, SignInData> {
  /** 头部区：连签数 / 积分 / 等级 / 倒计时 */
  renderHeader?(context: SignInPluginContext<T>): React.ReactNode;
  /** 日历区：日历条 / 月历网格 / 漏签标记 */
  renderCalendar?(context: SignInPluginContext<T>): React.ReactNode;
  /** 奖励区：逐日奖励预告 / 领取 / 里程碑 */
  renderRewards?(context: SignInPluginContext<T>): React.ReactNode;
  /** 操作区：签到 CTA / 补签 / 分享 / 提醒 / 邀请 */
  renderActions?(context: SignInPluginContext<T>): React.ReactNode;
  /** 底部区：规则展开 / 领取记录 */
  renderFooter?(context: SignInPluginContext<T>): React.ReactNode;
}

// ============ 插件定义 ============

export interface SignInPlugin<T = any>
  extends Plugin<SignInCoreProps, SignInData> {
  hooks: SignInPluginHooks<T>;
}

export type SignInPluginCreator<Config = any> = PluginCreator<
  Config,
  SignInCoreProps,
  SignInData
>;

/** 领域槽位名（包内 renderSignInSlot 消费，复用内核排序 + priority + 错误边界） */
export type SignInSlotName =
  | "renderHeader"
  | "renderCalendar"
  | "renderRewards"
  | "renderActions"
  | "renderFooter";

export type { PluginBus, PluginDoc };
