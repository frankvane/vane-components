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
 * vane-coupon 领域类型层。
 *
 * 内核 vane-plugin-core 已提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「券展示与领取」领域层的差异（数据模型 + 领取状态机字段）。
 *
 * 约定：领域钩子一律用「方法语法」声明参数（context: CouponPluginContext），
 * 以便内核把 context 收窄为领域上下文时通过 bivariance 校验（strictFunctionTypes 下
 * 参数逆变会拒绝领域钩子赋值）。
 */

// ============ 领域数据 ============

/** 券面数据：一张优惠券的静态描述 */
export interface CouponData {
  /** 稳定标识 */
  id: string;
  /** 券名称（右侧信息区主文案） */
  title: string;
  /** 面额：amountType 为 cash 时是金额（元），discount 时是折扣（如 8.5 = 8.5 折） */
  amount: number;
  /** 面额形态，默认 cash（¥ 前缀） */
  amountType?: "cash" | "discount";
  /** 使用门槛（满 X 元可用）；0 / undefined = 无门槛 */
  threshold?: number;
  /** 自定义门槛文案，覆盖默认推导 */
  thresholdText?: string;
  /** 使用规则条目（RuleExpandPlugin 渲染） */
  rules?: string[];
  /** 绝对有效期：开始时间（epoch ms） */
  validFrom?: number;
  /** 绝对有效期：结束时间（epoch ms） */
  validTo?: number;
  /** 相对有效期：领取后 N 天内有效 */
  validDays?: number;
  /** 发放总量（限量场景） */
  total?: number;
  /** 已领取数量 */
  claimed?: number;
  /** 是否可叠加（StackPlugin 徽标数据源） */
  stackable?: boolean;
  /** 任意业务数据 */
  [key: string]: any;
}

// ============ 领取状态机 ============

/**
 * 领取相位（7 态）：
 *   idle(未开始) → available(可领取) → claiming(领取中) → claimed(已领取)
 *   failed 不设独立态：领取失败回退 available 并经 onClaimError 上报。
 *   终态：used(已使用) / soldout(已抢空) / expired(已过期)；claimed 半终态（可核销为 used）。
 */
export type CouponPhase =
  | "idle"
  | "available"
  | "claiming"
  | "used"
  | "claimed"
  | "soldout"
  | "expired";

// ============ 有效期判定 ============

export type CouponValidityMode = "absolute" | "relative" | "none";

/** ValidityPlugin 的判定产出（写入内核 state.validity，ClaimState 联动读取） */
export interface CouponValidity {
  /** 判定依据的模式 */
  mode: CouponValidityMode;
  /** 当前是否在有效期内 */
  valid: boolean;
  /** 已过期（valid === false 且原因是过期末） */
  expired: boolean;
  /** 尚未开始（absolute 模式 validFrom > now） */
  notStarted: boolean;
  /** 剩余毫秒数（无法判定为 null） */
  remainingMs: number | null;
  /** 展示文案（完整有效期描述） */
  text: string;
  /** 紧迫态：剩余 ≤ urgentDays */
  urgent: boolean;
}

// ============ 插槽（由 withPlugins 用内核 renderPluginSlot 组装后注入 Core） ============

/**
 * 内核 renderPluginSlot 的输出逐段注入，让 Core 精确控制顺序：
 * before（角标区）→ 面额+标题本体 → after（有效期/规则等信息行）→ footer（操作区）→ overlay → children
 */
export interface CouponSlots {
  before: React.ReactNode[];
  overlay: React.ReactNode[];
  after: React.ReactNode[];
  footer: React.ReactNode[];
}

// ============ 核心组件 props / ref ============

export interface CouponCoreProps {
  /** 券面数据 */
  coupon: CouponData;
  /** 插槽内容（由 withPlugins 的 renderPluginSlot 组装） */
  slots?: CouponSlots;
  /** 当前领取相位（由 withPlugins 从内核 state 注入，Core 只读；裸核心为 undefined） */
  phase?: CouponPhase;
  children?: React.ReactNode;
  data?: unknown;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由 withPlugins 注入，插件通过 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
}

export interface CouponCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
  /** 当前领取相位（裸核心返回 undefined） */
  getPhase: () => CouponPhase | undefined;
}

// ============ 插件上下文 ============

/**
 * 券插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里补充领域字段。
 */
export interface CouponPluginContext
  extends PluginContext<CouponCoreProps, unknown> {
  /** 券面数据（props.coupon 的实时引用） */
  coupon: CouponData;
  /** 当前领取相位（读内核 state，未写入时默认 available） */
  phase: CouponPhase;
  /** 写入相位（内核 state，写入即触发 context 重建） */
  setPhase: (phase: CouponPhase) => void;
  /** 有效期判定结果（ValidityPlugin 写入；未安装为 null） */
  validity: CouponValidity | null;
  /** 规则是否展开（RuleExpandPlugin 使用） */
  rulesExpanded: boolean;
  /** 切换规则展开态 */
  toggleRules: () => void;
}

// ============ 插件钩子 ============

/**
 * 内核 9 钩子 + 领域 2 钩子（由 withPlugins 在对应 state 变化后触发）：
 *   onPhaseChange    —— 相位变化后（含 setPhase / 联动降级）
 *   onValidityChange —— 有效期判定结果变化后（ClaimState 借此联动降级 expired）
 *
 * 渲染面：core 只渲染「面额区 + 标题」本体，长尾一律走插槽：
 *   before → renderHeader(slotPosition:"before")  角标区（Stack）
 *   after  → renderHeader(slotPosition:"after")   规则（RuleExpand）/ 有效期（Validity）
 *   footer → renderFooter                          领取按钮（ClaimState）
 *   overlay → renderOverlay                        浮层
 */
export interface CouponPluginHooks
  extends PluginHooks<CouponCoreProps, unknown> {
  onPhaseChange?: (
    context: CouponPluginContext,
    phase: CouponPhase,
    prev: CouponPhase | undefined
  ) => void;
  onValidityChange?: (
    context: CouponPluginContext,
    validity: CouponValidity
  ) => void;
}

// ============ 插件定义 ============

export interface CouponPlugin extends Plugin<CouponCoreProps, unknown> {
  hooks: CouponPluginHooks;
}

export type CouponPluginCreator<Config = any> = PluginCreator<
  Config,
  CouponCoreProps,
  unknown
>;

export type { PluginBus, PluginDoc };
