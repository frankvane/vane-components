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
  /**
   * 业务日键（DayKey）：`yyyy-mm-dd`，口径为 {@link SignInData.businessTimeZone} 时区的
   * 自然日（缺省为本地时区）。**不是** UTC 日，也不要带时刻。
   * 与服务端按 `(userId, 业务日)` 的判定口径必须一致，否则东八区 00:00–08:00 会差一天。
   */
  date: string;
  /** 第几天（1-based），由服务端按签到周期计算 */
  day: number;
  status: DayStatus;
  reward?: RewardInfo;
  /** 漏签且仍在补签窗口内；窗口判定与配额复核由服务端负责，前端只做展示与目标筛选 */
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

/** 宿主回写的最近一次业务失败（用于 CTA / 开关的可见反馈） */
export interface SignInError {
  code?: string;
  message: string;
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
  /**
   * 下次签到资格重置的绝对时刻（epoch 毫秒，**不要**按本地 23:59 自己构造）。
   * Core 每秒心跳 + 回到前台时用它判定「跨日」，跨过后签到 CTA 自动解除禁用。
   */
  nextResetAt?: number;
  /**
   * 业务日所在 IANA 时区（如 `"Asia/Shanghai"`），缺省用运行环境本地时区。
   * 日历 `date`、`todayKey`、领取记录时间展示都按它归一。
   */
  businessTimeZone?: string;
  /**
   * 宿主当前业务日键（`yyyy-mm-dd`）。缺省时包内用 `toDayKey(now, businessTimeZone)` 推导。
   * 提供它可获得与倒计时无关的跨夜复位能力（`nextResetAt` 缺失时仍然生效）。
   */
  todayKey?: string;
  /** 最近一次业务失败（宿主回写），CTA 会把它展示为可见错误提示 */
  lastError?: SignInError;
  /** 提醒开关的受控真值（可选）：提供时作为开关初值，缺省用插件 config.defaultOn */
  remindEnabled?: boolean;
  level?: LevelInfo;
  rules?: string[];
  history?: ClaimRecord[];
}

/** 回调统一返回形态：同步成功（void）或异步成功（resolve）/ 失败（reject） */
export type SignInCallbackResult = void | Promise<void>;

/** 业务回调 */
export interface SignInCallbacks {
  sign?: () => SignInCallbackResult;
  claim?: (day: number) => SignInCallbackResult;
  /**
   * 补签：第二个参数携带格子的 `day` 便于服务端对账（旧实现只用 date，仍兼容）。
   * 目标由包内按「不晚于业务日的 canMakeup 格、日期最早优先」选出。
   */
  makeup?: (date: string, detail?: { day: number }) => SignInCallbackResult;
  share?: () => SignInCallbackResult;
  remind?: (enabled: boolean) => SignInCallbackResult;
  invite?: () => SignInCallbackResult;
  /** 数据刷新请求：Core 在页面回到前台（visibilitychange / focus）时触发 */
  refresh?: () => SignInCallbackResult;
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
 * 泛型默认值约定：本文件 SignInPluginContext / SignInPluginHooks / SignInPlugin /
 * SignInPluginCreator 的 T（以及后者的 Config）默认值保持 any。
 * 这些都是对外导出的公共契约位——消费方常以「不写全泛型」的形式使用（直接声明
 * SignInPlugin 数组、调用 useSignInContext() 等）；收紧为 unknown 会让其 data /
 * props 属性访问与赋值直接 tsc 失败。实现内部（slots.tsx / withPlugins.tsx）已收敛为
 * unknown。SignInPluginContext 的 T 不参与 data 形态（data 恒为 SignInData），
 * 以下划线前缀标注保留的泛型位，避免被 no-unused-vars 误判为死代码。
 */

/**
 * 签到插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / forceUpdate / getSize / logger；这里把 data 收敛为领域视图
 * SignInData（基类 data 为可选泛型，领域覆盖为必填 SignInData），并补充 callbacks
 * （业务动作入口）。保持 data 必填，插件内 `ctx.data.streak` 等访问无需可空判断。
 */
export interface SignInPluginContext<_T = any>
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
