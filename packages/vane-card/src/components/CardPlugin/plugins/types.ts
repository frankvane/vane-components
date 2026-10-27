/**
 * CardPlugin 插件系统类型定义（C2 迁移后）
 *
 * 复用 vane-plugin-core 的 PluginContext / PluginHooks / PluginBus 作为内核，
 * 这里只声明「卡片领域层」的差异：
 *  - CardPluginContext：内核 context + 卡片专属字段（cardId / data / size / getContainer / getSize / sharedData / bus）
 *  - CardPluginHooks：15 个钩子 = 内核 9 + 领域 6（见下方分组）
 *  - 已删除 9 个死钩子（onSelectionChange / onCartChange / onWishlistChange /
 *    onBeforeDataChange / onDataChange / renderContainer / renderContentWrapper /
 *    renderBadge / renderActions），其能力由 setState 差分 / renderOverlay 替代。
 */

import type React from "react";
import type { CardCoreProps } from "../core/CardCore";

// ============ 基础数据类型 ============

/**
 * 插件总线接口。
 *
 * 这里自带声明而不从内核 re-export：内核 vane-plugin-core 是「实现细节」，
 * 构建时已内联进 dist，且未发布到 npm。若公开 d.ts 里出现
 * `import type { PluginBus } from "vane-plugin-core"`，消费方装包后
 * TS 会直接报 Cannot find module。
 *
 * 形状与内核 PluginBus 完全一致（结构类型，可互换赋值），
 * 因此运行时把内核的 bus 传进来是类型安全的。
 */
export interface PluginBus {
  emit<T = unknown>(event: string, data?: T): void;
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  off(event: string, handler?: (data: unknown) => void): void;
  getData<T = unknown>(key: string): T | undefined;
  setData<T = unknown>(key: string, value: T): void;
  deleteData(key: string): void;
  hasData(key: string): boolean;
  getAll(): Record<string, unknown>;
  clear(): void;
}

/**
 * 卡片状态信息（同时是 vane-plugin-core 运行时 state 的形状）
 */
export interface CardState {
  isHovered: boolean;
  isVisible: boolean;
  isActive: boolean;
  isSelected: boolean;
  cart: boolean; // 购物车状态
  wishlist: boolean; // 心愿单状态
}

/**
 * 卡片尺寸信息
 */
export interface CardSize {
  width: number;
  height: number;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  type: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  devicePixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
  isTouchDevice: boolean;
  isRetina: boolean;
}

/**
 * 动画配置
 */
export interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: string;
}

// ============ 插件上下文 ============

/**
 * 卡片插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里补充卡片
 * 专属字段，供插件按语义访问。插件代码里拿到的就是这个完整类型。
 */
export interface CardPluginContext<T = any> {
  // —— 内核已有字段（保持同名，便于 plugin-core 内部透传）——
  props: CardCoreProps<T>;
  data?: T;
  bus: PluginBus;
  /** 跨插件共享数据（走 React 渲染之外，plugin-core 的 shared） */
  sharedData: Map<string, any>;
  /** 领域字段：setState 差分会触发 onStateChange */
  state: CardState;
  setState: (updates: Partial<CardState>) => void;
  deviceInfo: DeviceInfo;
  forceUpdate: () => void;
  getSize: () => CardSize;

  // —— 卡片专属字段 ——
  cardId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  getContainer: () => HTMLDivElement | null;
  size: CardSize;
}

// ============ 插件钩子定义 ============

/**
 * 15 个钩子 = 内核 9 + 领域 6。
 * 内核 9（直接由 vane-plugin-core 驱动，语义见其 PluginHooks 注释）：
 *   onMount / onUnmount / onPropsChange / onError /
 *   transformProps / transformData / renderOverlay / renderHeader / renderFooter
 * 领域 6（卡片独有，由 withPlugins 桥接到 Core 回调 / 状态差分）：
 *   onClick / onHover / onVisibilityChange / onResize / onStateChange / renderPriceArea
 *
 * 注意：用「方法语法」声明参数（context: CardPluginContext<T>），以便 plugin-core
 * 把 context 收窄为领域上下文时通过 bivariance 校验。
 */
export interface CardPluginHooks<T = any> {
  // ========== 内核 · 生命周期 ==========
  onMount?: (context: CardPluginContext<T>) => void | (() => void);
  onUnmount?: (context: CardPluginContext<T>) => void;
  onPropsChange?: (
    context: CardPluginContext<T>,
    prevProps: CardCoreProps<T>,
    nextProps: CardCoreProps<T>
  ) => void;
  onError?: (
    context: CardPluginContext<T>,
    error: Error,
    errorInfo?: React.ErrorInfo
  ) => void;

  // ========== 内核 · Props / Data 转换 ==========
  transformProps?: (props: CardCoreProps<T>) => CardCoreProps<T>;
  transformData?: (context: CardPluginContext<T>, data: T) => T;

  // ========== 内核 · 渲染插槽 ==========
  renderOverlay?: (context: CardPluginContext<T>) => React.ReactNode;
  renderHeader?: (context: CardPluginContext<T>) => React.ReactNode;
  renderFooter?: (context: CardPluginContext<T>) => React.ReactNode;

  // ========== 领域 · 交互 ==========
  onClick?: (context: CardPluginContext<T>, event: React.MouseEvent) => void;
  onHover?: (context: CardPluginContext<T>, isHovered: boolean) => void;
  onVisibilityChange?: (
    context: CardPluginContext<T>,
    isVisible: boolean
  ) => void;

  // ========== 领域 · 尺寸 ==========
  onResize?: (
    context: CardPluginContext<T>,
    width: number,
    height: number
  ) => void;

  // ========== 领域 · 状态差分 ==========
  /**
   * 状态变化后触发（setState updater 保持纯函数，差分在此处算，避免旧版在
   * updater 内同步触发 onStateChange 导致的重渲染抖动）。prev/next 为整个 CardState。
   */
  onStateChange?: (
    context: CardPluginContext<T>,
    prevState: CardState,
    nextState: CardState
  ) => void;

  // ========== 领域 · 价格区插槽 ==========
  /**
   * 价格区领域槽：比价 / 省钱徽章 / 单位价 / 可领券提示等。由复合组件通过
   * usePluginSlot("priceArea") 读取渲染，排序规则与内核插槽一致
   * （config.order 升序 → priority 降序）。
   */
  renderPriceArea?: (context: CardPluginContext<T>) => React.ReactNode;
}

// ============ 插件定义 ============

export interface CardPlugin<T = any> {
  /** 插件名称（唯一标识） */
  name: string;
  /** 插件版本 */
  version?: string;
  /** 插件描述 */
  description?: string;
  /** 插件钩子 */
  hooks: CardPluginHooks<T>;
  /** 插件配置（order / priority / 渲染位置等都挂在 config 上） */
  config?: Record<string, any>;
  /** 插件依赖（需要先加载的插件名称） */
  dependencies?: string[];
  /** 越大越先执行；渲染插槽内越大越靠后（用 config.order 控制位置） */
  priority?: number;
  /** 是否启用 */
  enabled?: boolean;
}

// ============ 工具类型 ============

/** 插件工厂：可调用 + 挂载 meta，供文档生成与 demo 导航使用 */
export type PluginCreator<T = any, Config = any> = (
  config?: Config
) => CardPlugin<T>;

/** WithPlugins 配置 */
export interface WithPluginsConfig<T = any> {
  plugins: CardPlugin<T>[];
  enableDebug?: boolean;
}
