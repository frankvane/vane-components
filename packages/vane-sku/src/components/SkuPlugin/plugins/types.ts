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
 * vane-sku 领域类型层。
 *
 * 内核 vane-plugin-core 已提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「规格选择」领域层的差异（B3 数据模型 + 选规格状态机字段）。
 *
 * 约定：领域钩子一律用「方法语法」声明参数（context: SkuPluginContext），
 * 以便内核把 context 收窄为领域上下文时通过 bivariance 校验（strictFunctionTypes 下
 * 参数逆变会拒绝领域钩子赋值）。
 */

// ============ 领域数据（B3） ============

/** 规格选项：稳定 id（禁用推导与 i18n 的刚需）+ 展示文案 + 可选色块图 */
export interface SkuOption {
  /** 稳定标识（不再是展示字符串） */
  id: string;
  /** 展示文案 */
  label: string;
  /** 色块图（颜色类规格） */
  image?: string;
}

/** 规格属性，如「颜色」「尺码」 */
export interface SkuAttribute {
  name: string;
  options: SkuOption[];
}

/** SKU 变体：一组完整规格取值 → 价格 / 库存 / 图 / 限购 */
export interface SkuVariant {
  /** 变体唯一键 */
  sku: string;
  /** 规格取值，键为属性名、值为 optionId */
  attrValues: Record<string, string>;
  price?: number;
  originalPrice?: number;
  /** 库存（0 视为缺货，参与 ignoreOutOfStock 判定） */
  stock?: number;
  /** 变体主图（ImageLink 切换用） */
  image?: string;
  /** 每人限购件数（Quota 插件用） */
  quota?: number;
}

/** 当前选择：属性名 → optionId */
export type SkuSelection = Record<string, string>;

// ============ 插槽（由 withSkuPlugins 用内核 renderPluginSlot 组装后注入 Core） ============

/**
 * 内核 renderPluginSlot 的输出逐段注入，让 Core 精确控制顺序（B5）：
 * before → 规格按钮组 → 选中摘要 → overlay → after → footer → children
 * 若整块塞进 children，「before 段」会被压到规格组下方，语义就错了。
 */
export interface SkuSlots {
  before: React.ReactNode[];
  overlay: React.ReactNode[];
  after: React.ReactNode[];
  footer: React.ReactNode[];
}

// ============ 核心组件 props / ref ============

export interface SkuSelectorCoreProps {
  /** 插槽内容（由 withPlugins 的 composeSlots 组装：before/overlay/after/footer） */
  children?: React.ReactNode;
  /** 规格属性定义 */
  attributes: SkuAttribute[];
  /** 变体列表 */
  variants: SkuVariant[];
  /** 默认选择（属性名 → optionId），未指定则初始为空 */
  defaultSelection?: SkuSelection;
  /**
   * 缺货变体（stock===0）是否参与可用推导。
   * true（默认）：缺货变体视为不存在 → 通往它的选项被置灰
   */
  ignoreOutOfStock?: boolean;
  /** 任意选择变化 */
  onChange?: (selection: SkuSelection, variant: SkuVariant | null) => void;
  /** 选全并命中变体时触发 */
  onValidSkuChange?: (variant: SkuVariant) => void;
  /** 业务数据（透传给内核 context.data） */
  data?: unknown;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由 withSkuPlugins 注入，插件通过 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;

  // ---- 以下由 withSkuPlugins 注入，Core 只读 ----
  /** 逐段插槽（内核 renderPluginSlot 输出） */
  slots?: SkuSlots;
  selection?: SkuSelection;
  disabledMap?: Record<string, Set<string>>;
  variant?: SkuVariant | null;
  onSelectOption?: (attrName: string, optionId: string) => void;
}

export interface SkuSelectorCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
  /** 当前选择（属性名 → optionId） */
  getSelection: () => SkuSelection;
  /** 当前命中的变体（未命中为 null） */
  getVariant: () => SkuVariant | null;
}

// ============ 插件上下文 ============

/**
 * 规格选择插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里补充领域字段。
 */
export interface SkuPluginContext
  extends PluginContext<SkuSelectorCoreProps, unknown> {
  /** 当前选择 */
  selection: SkuSelection;
  /** 禁用推导结果：属性名 → 被置灰的 optionId 集合 */
  disabledMap: Record<string, Set<string>>;
  /** 当前命中的变体（未选全或未命中为 null） */
  variant: SkuVariant | null;
  /** 规格是否已选全 */
  isComplete: boolean;
  /** 选择某个选项（写入内核 state，触发 context 重建） */
  selectOption: (attrName: string, optionId: string) => void;
  /** 清空全部选择（ResetBar / StatePersistence 等需要整段重置时用） */
  clearSelection: () => void;
}

// ============ 插件钩子 ============

/**
 * 内核 9 钩子 + 规格选择领域 1 钩子 onSkuChange（选择/变体变化后由 withSkuPlugins 触发）。
 *
 * 渲染面（B5）：core 只渲染「规格按钮组（含禁用态）+ 选中摘要」，
 * 长尾一律走内核三槽：
 *   before → renderHeader(slotPosition:"before")  标题/头部
 *   overlay → renderOverlay                        价格浮层（PriceLink）
 *   after  → renderHeader(slotPosition:"after")    限购提示条（Quota）/ 加购区
 *   footer → renderFooter
 */
export interface SkuPluginHooks extends PluginHooks<SkuSelectorCoreProps, unknown> {
  /** 选择或命中变体变化后触发（事件钩子，非渲染） */
  onSkuChange?: (
    context: SkuPluginContext,
    selection: SkuSelection,
    variant: SkuVariant | null
  ) => void;
}

// ============ 插件定义 ============

export interface SkuPlugin extends Plugin<SkuSelectorCoreProps, unknown> {
  hooks: SkuPluginHooks;
}

export type SkuPluginCreator<Config = any> = PluginCreator<
  Config,
  SkuSelectorCoreProps,
  unknown
>;

export type { PluginBus, PluginDoc };
