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
 * vane-profile 领域类型层。
 *
 * 内核 vane-plugin-core 已提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「主页领域层」的差异：
 *  - ProfileCoreProps / ProfileCoreRef：核心组件 props / ref；
 *  - ProfilePluginContext：内核 context + 主页专属字段（activeTab / stats / followState / …）；
 *  - ProfilePluginHooks：内核 9 钩子 + 领域 5 个渲染槽 + onTabChange 事件钩子；
 *  - ProfilePlugin：插件定义。
 *
 * 约定：领域钩子一律用「方法语法」声明参数（context: ProfilePluginContext<T>），
 * 以便内核把 context 收窄为领域上下文时通过 bivariance 校验（strictFunctionTypes 下
 * 参数逆变会拒绝领域钩子赋值）。
 */

// ============ 领域数据 ============

/** 单条主页指标（关注 / 粉丝 / 获赞 / 作品 …） */
export interface StatItem {
  /** 展示值（数字或任意节点） */
  value: React.ReactNode;
  /** 指标名 */
  label: string;
  /** React key（缺省时按顺序兜底） */
  key?: string;
}

/** 关注态（FollowEcho 回显） */
export type FollowState = "none" | "following" | "mutual";

/** 认证类型（VerifyBadge） */
export type BadgeType = "personal" | "institution";

// ============ 核心组件 props / ref ============

export interface ProfileCoreProps<T = any> {
  /** 内容子节点（内容区，随 activeTab 重渲染） */
  children?: React.ReactNode;
  /** 默认激活的页签 id（未指定则初始为 null） */
  defaultActiveTab?: string | null;
  /** 主页指标数据（StatRow 读取；也可由插件经 context 注入） */
  stats?: StatItem[];
  /** 关注态（FollowEcho 读取） */
  followState?: FollowState;
  /** 是否认证（VerifyBadge 读取） */
  verified?: boolean;
  /** 认证类型（VerifyBadge 读取） */
  badgeType?: BadgeType;
  /** 头图区自定义内容（BannerSlot 读取；也可由插件经 context 注入） */
  banner?: React.ReactNode;
  /** 业务数据（透传给内核 context.data） */
  data?: T;
  /** 容器类名 */
  containerClassName?: string;
  /** 容器内联样式 */
  containerStyle?: React.CSSProperties;
  /** 生命周期回调（透传给插件链） */
  onMount?: () => void;
  onUnmount?: () => void;
  /** 调试开关 */
  debug?: boolean;
  /** 由 withProfilePlugins 注入，插件通过 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement>;
}

export interface ProfileCoreRef {
  /** 获取主页容器 DOM */
  getContainer: () => HTMLDivElement | null;
  /** 强制刷新宿主组件 */
  forceUpdate: () => void;
  /** 读取容器尺寸 */
  getSize: () => { width: number; height: number };
  /** 读取当前激活页签（TabSync 驱动；内容区也可经 useProfileContext 订阅） */
  getActiveTab: () => string | null;
}

// ============ 插件上下文 ============

/**
 * 主页插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里补充主页
 * 专属字段，供插件按语义访问。插件代码里拿到的就是这个完整类型。
 */
export interface ProfilePluginContext<T = any>
  extends PluginContext<ProfileCoreProps<T>, T> {
  /** 当前激活页签 id（TabSync 写入；内容区订阅以联动重渲染） */
  activeTab: string | null;
  /** 切换激活页签（写入内核 state，触发 context 重建与订阅者重渲染） */
  setActiveTab: (id: string | null) => void;
  /** 主页指标数据（StatRow 渲染源） */
  stats: StatItem[];
  /** 关注态（FollowEcho 渲染源） */
  followState: FollowState;
  /** 是否认证（VerifyBadge 渲染源） */
  verified: boolean;
  /** 认证类型（VerifyBadge 渲染源） */
  badgeType: BadgeType;
  /** 头图区自定义内容（BannerSlot 渲染源） */
  banner: React.ReactNode | null;
}

// ============ 插件钩子 ============

/**
 * 内核 9 钩子（onMount / onUnmount / onPropsChange / onError / transformProps /
 * transformData / renderOverlay / renderHeader / renderFooter）+ 主页领域 8 钩子：
 *   renderBannerArea / renderBioArea / renderStatRow / renderTabBar /
 *   renderBadgeArea / renderFollowArea / renderContentArea（7 个结构化段落 / 内容槽）
 *   + onTabChange（页签切换事件钩子）。
 *
 * 注意：内核插槽模型只有 header / overlay / footer 三类，没有「内容段落」插入点；
 * 主页的「头图区 / 数据行 / 页签栏」是结构化段落，因此走包内领域槽（见 slots.tsx），
 * 内核三槽仅兜底叠加类（如 VerifyBadge 想绝对定位浮在头图右上角可改走 renderOverlay）。
 */
export interface ProfilePluginHooks<T = any>
  extends PluginHooks<ProfileCoreProps<T>, T> {
  /** 头图区：封面图 / 渐变背景 / 头像浮层位 */
  renderBannerArea?: (context: ProfilePluginContext<T>) => React.ReactNode;
  /** 数据行：关注 / 粉丝 / 获赞 / 作品指标 */
  renderStatRow?: (context: ProfilePluginContext<T>) => React.ReactNode;
  /** 页签栏：渲染页签按钮；点击经 ctx.setActiveTab 驱动内容区联动 */
  renderTabBar?: (context: ProfilePluginContext<T>) => React.ReactNode;
  /** 认证徽标区（默认位头图右上角浮层） */
  renderBadgeArea?: (context: ProfilePluginContext<T>) => React.ReactNode;
  /** 关注回显区 */
  renderFollowArea?: (context: ProfilePluginContext<T>) => React.ReactNode;
  /** 简介区：昵称 / 签名 / 所在地 / 加入时间（排在头图与数据行之间） */
  renderBioArea?: (context: ProfilePluginContext<T>) => React.ReactNode;
  /** 内容区：插件贡献的内容面板（随 activeTab 联动；有内容插件时覆盖 children） */
  renderContentArea?: (context: ProfilePluginContext<T>) => React.ReactNode;
  /** 页签切换事件钩子（activeTab 变化后由 withProfilePlugins 触发） */
  onTabChange?: (
    context: ProfilePluginContext<T>,
    newTab: string | null,
    oldTab: string | null
  ) => void;
}

// ============ 插件定义 ============

/** 主页插件：在内核 Plugin 基础上把 hooks 收窄为领域钩子 */
export interface ProfilePlugin<T = any> extends Plugin<ProfileCoreProps<T>, T> {
  hooks: ProfilePluginHooks<T>;
}

/** 插件工厂：可调用 + 挂载 meta，供文档生成与 demo 导航使用 */
export type ProfilePluginCreator<Config = any, T = any> = PluginCreator<
  Config,
  ProfileCoreProps<T>,
  T
>;

/** 领域槽位名（包内 renderProfileSlot 消费，复用内核排序 + priority + 错误边界） */
export type ProfileSlotName =
  | "renderBannerArea"
  | "renderBioArea"
  | "renderStatRow"
  | "renderTabBar"
  | "renderBadgeArea"
  | "renderFollowArea"
  | "renderContentArea";

export type { PluginBus, PluginDoc };
