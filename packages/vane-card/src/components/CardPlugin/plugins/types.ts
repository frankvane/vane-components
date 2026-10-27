/**
 * CardPlugin 插件系统类型定义
 */

import type { CardCoreProps } from "../core/CardCore";
import type React from "react";

// ============ 基础数据类型 ============

/**
 * 卡片状态信息
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

// ============ 插件通信总线 ============

export interface PluginBus {
  // 事件发布订阅
  emit: <T = any>(event: string, data?: T) => void;
  on: <T = any>(event: string, handler: (data: T) => void) => () => void;
  once: <T = any>(event: string, handler: (data: T) => void) => () => void;
  off: (event: string, handler?: (data: any) => void) => void;

  // 数据共享
  getData: <T = any>(key: string) => T | undefined;
  setData: <T = any>(key: string, value: T) => void;
  deleteData: (key: string) => void;
  hasData: (key: string) => boolean;

  // 批量操作
  getAll: () => Record<string, any>;
  clear: () => void;
}

// ============ 插件上下文 ============

export interface CardPluginContext<T = any> {
  // 基础数据
  cardId: string;
  data?: T;

  // DOM 引用
  containerRef: React.RefObject<HTMLDivElement | null>;
  getContainer: () => HTMLDivElement | null;

  // 状态
  state: CardState;
  setState: (updates: Partial<CardState>) => void;

  // 尺寸
  size: CardSize;

  // 配置
  props: CardCoreProps<T>;

  // 插件通信
  bus?: PluginBus;
  sharedData?: Map<string, any>;

  // 扩展信息
  deviceInfo?: DeviceInfo;

  // 工具方法
  forceUpdate: () => void;
  getSize: () => CardSize;
}

// ============ 插件钩子定义 ============

export interface CardPluginHooks<T = any> {
  // ========== 生命周期钩子 ==========

  /**
   * 组件挂载时触发
   * @returns 清理函数（可选）
   */
  onMount?: (context: CardPluginContext<T>) => void | (() => void);

  /**
   * 组件卸载时触发
   */
  onUnmount?: (context: CardPluginContext<T>) => void;

  /**
   * Props 变化时触发
   */
  onPropsChange?: (
    context: CardPluginContext<T>,
    prevProps: CardCoreProps<T>,
    nextProps: CardCoreProps<T>
  ) => void;

  // ========== 交互钩子 ==========

  /**
   * 点击时触发
   */
  onClick?: (context: CardPluginContext<T>, event: React.MouseEvent) => void;

  /**
   * 悬停状态变化时触发
   */
  onHover?: (context: CardPluginContext<T>, isHovered: boolean) => void;

  /**
   * 可见性变化时触发
   */
  onVisibilityChange?: (
    context: CardPluginContext<T>,
    isVisible: boolean
  ) => void;

  /**
   * 选中状态变化时触发
   */
  onSelectionChange?: (
    context: CardPluginContext<T>,
    isSelected: boolean
  ) => void;

  // ========== 状态钩子 ==========

  /**
   * 购物车状态变化时触发
   */
  onCartChange?: (context: CardPluginContext<T>, isAdded: boolean) => void;

  /**
   * 心愿单状态变化时触发
   */
  onWishlistChange?: (
    context: CardPluginContext<T>,
    isWishlisted: boolean
  ) => void;

  /**
   * 状态变化时触发
   */
  onStateChange?: (
    context: CardPluginContext<T>,
    prevState: CardState,
    nextState: CardState
  ) => void;

  // ========== 尺寸钩子 ==========

  /**
   * 尺寸变化时触发
   */
  onResize?: (
    context: CardPluginContext<T>,
    width: number,
    height: number
  ) => void;

  // ========== 数据钩子 ==========

  /**
   * 数据变化前触发
   * @returns false 可以阻止数据更新
   */
  onBeforeDataChange?: (
    context: CardPluginContext<T>,
    oldData: T,
    newData: T
  ) => boolean | Promise<boolean>;

  /**
   * 数据变化后触发
   */
  onDataChange?: (
    context: CardPluginContext<T>,
    oldData: T,
    newData: T
  ) => void;

  // ========== 错误钩子 ==========

  /**
   * 错误发生时触发
   */
  onError?: (
    context: CardPluginContext<T>,
    error: Error,
    errorInfo?: React.ErrorInfo
  ) => void;

  // ========== 渲染钩子 ==========

  /**
   * 自定义容器渲染
   */
  renderContainer?: (
    context: CardPluginContext<T>,
    children: React.ReactNode
  ) => React.ReactNode;

  /**
   * 自定义内容包装器渲染
   */
  renderContentWrapper?: (
    context: CardPluginContext<T>,
    children: React.ReactNode
  ) => React.ReactNode;

  /**
   * 自定义覆盖层渲染（加载状态、遮罩等）
   */
  renderOverlay?: (context: CardPluginContext<T>) => React.ReactNode;

  /**
   * 自定义头部渲染
   */
  renderHeader?: (context: CardPluginContext<T>) => React.ReactNode;

  /**
   * 自定义底部渲染
   */
  renderFooter?: (context: CardPluginContext<T>) => React.ReactNode;

  /**
   * 自定义徽章渲染
   */
  renderBadge?: (context: CardPluginContext<T>) => React.ReactNode;

  /**
   * 自定义操作按钮渲染
   */
  renderActions?: (context: CardPluginContext<T>) => React.ReactNode;

  /**
   * 自定义价格区域渲染（比价/省钱徽章/单位价/可领券提示等）
   * 可选钩子，默认不渲染
   */
  renderPriceArea?: (context: CardPluginContext<T>) => React.ReactNode;

  // ========== Props 转换钩子 ==========

  /**
   * 转换 Props（可以在组件接收 props 前修改）
   */
  transformProps?: (props: CardCoreProps<T>) => CardCoreProps<T>;

  /**
   * 转换数据（可以在渲染前修改数据）
   */
  transformData?: (context: CardPluginContext<T>, data: T) => T;
}

// ============ 插件定义 ============

export interface CardPlugin<T = any> {
  /**
   * 插件名称（唯一标识）
   */
  name: string;

  /**
   * 插件版本
   */
  version?: string;

  /**
   * 插件描述
   */
  description?: string;

  /**
   * 插件钩子
   */
  hooks: CardPluginHooks<T>;

  /**
   * 插件配置
   */
  config?: Record<string, any>;

  /**
   * 插件依赖（需要先加载的插件名称）
   */
  dependencies?: string[];

  /**
   * 插件优先级（数字越大优先级越高）
   */
  priority?: number;

  /**
   * 插件初始化
   */
  init?: () => void | Promise<void>;

  /**
   * 插件销毁
   */
  destroy?: () => void | Promise<void>;

  /**
   * 插件是否启用
   */
  enabled?: boolean;
}

// ============ 插件管理器 ============

export interface PluginManager<T = any> {
  /**
   * 注册插件
   */
  register: (plugin: CardPlugin<T>) => void;

  /**
   * 批量注册插件
   */
  registerAll: (plugins: CardPlugin<T>[]) => void;

  /**
   * 注销插件
   */
  unregister: (pluginName: string) => void;

  /**
   * 获取插件
   */
  getPlugin: (pluginName: string) => CardPlugin<T> | undefined;

  /**
   * 获取所有插件
   */
  getAllPlugins: () => CardPlugin<T>[];

  /**
   * 获取启用的插件
   */
  getEnabledPlugins: () => CardPlugin<T>[];

  /**
   * 启用插件
   */
  enablePlugin: (pluginName: string) => void;

  /**
   * 禁用插件
   */
  disablePlugin: (pluginName: string) => void;

  /**
   * 检查插件是否已注册
   */
  hasPlugin: (pluginName: string) => boolean;

  /**
   * 执行钩子
   */
  executeHook: <K extends keyof CardPluginHooks<T>>(
    hookName: K,
    context: CardPluginContext<T>,
    ...args: any[]
  ) => Promise<any>;

  /**
   * 清空所有插件
   */
  clear: () => void;
}

// ============ 工具类型 ============

/**
 * 插件创建器类型
 */
export type PluginCreator<T = any, Config = any> = (
  config?: Config
) => CardPlugin<T>;

/**
 * WithPlugins 配置
 */
export interface WithPluginsConfig<T = any> {
  plugins: CardPlugin<T>[];
  enableDebug?: boolean;
}
