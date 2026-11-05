import type React from "react";

/**
 * ============================================================
 * Vane Plugin Spec · 类型层（唯一权威定义）
 * 所有 vane-* 组件包的插件类型都必须从这里派生，不允许另起一套。
 * ============================================================
 */

// ---------- 日志 ----------

export interface PluginLogger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

// ---------- 设备信息 ----------

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

// ---------- 事件总线 ----------

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

// ---------- 插件上下文 ----------

export interface PluginRefs {
  container?: React.RefObject<HTMLElement | null>;
  getContainer?: () => HTMLElement | null;
}

/**
 * 泛型默认值说明：Plugin / PluginHooks / PluginContext / PluginCreator / PluginManager
 * 的 TProps / TData 默认值保持 any，而不是 unknown。原因已实测：领域包大量以
 * `Plugin[]`、`PluginCreator<Config>` 这类「不写全泛型」的形式声明插件，改成
 * unknown / never 会让 10 个领域包的 `tsc` 直接失败（类型不变性 + 属性逆变）。
 * 这是「未指定」语义的占位默认值，不是实现内部偷懒；实现内部（bus/manager/slots
 * 的存储与读取）已全部收敛为 unknown。
 */
export interface PluginContext<TProps = unknown, TData = unknown> {
  /** 组件当前 props */
  props: TProps;
  /** 组件当前数据 */
  data?: TData;
  /** 事件总线 */
  bus: PluginBus;
  /** DOM 引用 */
  refs: PluginRefs;
  /** 共享状态（跨插件） */
  state: Record<string, unknown>;
  setState: (patch: Record<string, unknown>) => void;
  /** 共享数据（跨插件，不走 React 渲染） */
  shared: Map<string, unknown>;
  /** 设备信息（全局缓存，见 utils/detectDevice） */
  deviceInfo: DeviceInfo;
  /** 强制刷新宿主组件 */
  forceUpdate: () => void;
  /** 读取宿主尺寸 */
  getSize: () => { width: number; height: number };
  logger: PluginLogger;
}

// ---------- 钩子 ----------

/**
 * 生命周期钩子（onMount / onUnmount / onPropsChange / onError）的返回值语义：
 *  - 返回函数：注册为清理函数，`manager.clear()` 时逆序执行（onMount 的 React 式写法）；
 *  - 返回 false：中断整条钩子链，后续插件不再执行；
 *  - 返回其他非 undefined/true 的值：短路，该值作为 executeHook 的结果返回；
 *  - undefined / true：继续执行下一个插件。
 *
 * 领域钩子（各组件自定义）不走清理语义，只走短路语义。
 *
 * 注意：成员一律用「方法语法」而非「箭头函数属性语法」声明——TS 对方法参数
 * 是双变的，领域包可以把 context 收窄为领域上下文（如 LazyImageContext），
 * 否则 strictFunctionTypes 下参数逆变会直接拒绝领域钩子赋值。
 */
export interface PluginHooks<TProps = unknown, TData = unknown> {
  /** 挂载；可返回清理函数（clear 时执行） */
  onMount?(context: PluginContext<TProps, TData>): unknown;
  /** 卸载 */
  onUnmount?(context: PluginContext<TProps, TData>): unknown;
  /** props 变化 */
  onPropsChange?(
    context: PluginContext<TProps, TData>,
    prev: TProps,
    next: TProps
  ): unknown;
  /** 错误（沙箱隔离后仍会上报） */
  onError?(
    context: PluginContext<TProps, TData>,
    error: Error,
    errorInfo?: React.ErrorInfo
  ): unknown;
  /** 转发前改写 props（链式，按 order 顺序） */
  transformProps?(props: TProps): TProps;
  /** 渲染前改写 data */
  transformData?(context: PluginContext<TProps, TData>, data: TData): TData;
  /** 覆盖层渲染（绝对定位叠加层） */
  renderOverlay?(context: PluginContext<TProps, TData>): React.ReactNode;
  /** 头部渲染，config.slotPosition = "before" | "after" */
  renderHeader?(context: PluginContext<TProps, TData>): React.ReactNode;
  /** 底部渲染 */
  renderFooter?(context: PluginContext<TProps, TData>): React.ReactNode;
  /** 领域钩子索引签名 */
  [hookName: string]: unknown;
}

// ---------- 插件 ----------

export interface Plugin<TProps = any, TData = any> {
  /** 唯一标识，kebab-case */
  name: string;
  version?: string;
  description?: string;
  hooks: PluginHooks<TProps, TData>;
  /**
   * 插件配置（由插件工厂透传，形态由各领域自定义）。
   * 说明：领域配置多为 interface，而 interface 没有隐式索引签名，写成
   * `Record<string, unknown>` 会拒绝所有领域配置；写成 unknown 又会让下游
   * `plugin.config?.order` 这类读取报错。此处 `Record<string, any>` 是唯一能
   * 同时满足「接收任意领域配置」与「读取任意键」的等价类型，故保留。
   */
  config?: Record<string, any>;
  /** 依赖的插件名（先注册依赖，再注册自己） */
  dependencies?: string[];
  /** 越大越先执行；渲染插槽内越大越靠后（用 config.order 控制） */
  priority?: number;
  enabled?: boolean;
  /** 是否沙箱执行，默认 true */
  sandbox?: boolean;
  /** 异步钩子超时（ms），默认 3000 */
  timeout?: number;
  init?: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

// ---------- 插件文档（机器可读，驱动文档生成） ----------

export interface PluginDocConfigItem {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface PluginDoc {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: PluginDocConfigItem[];
  example?: string;
  /** 同组互斥插件，如 ["FadeInPlugin"] */
  conflicts?: string[];
}

/** 插件工厂：可调用 + 挂载 meta，供文档生成与 demo 导航使用 */
export interface PluginCreator<
  Config = any,
  TProps = any,
  TData = any
> {
  (config?: Config): Plugin<TProps, TData>;
  meta: PluginDoc;
}

// ---------- 插件管理器 ----------

export interface PluginManager<TProps = unknown, TData = unknown> {
  register(plugin: Plugin<TProps, TData>): void;
  registerAll(plugins: Plugin<TProps, TData>[]): void;
  unregister(name: string): void;
  getPlugin(name: string): Plugin<TProps, TData> | undefined;
  getAllPlugins(): Plugin<TProps, TData>[];
  getEnabledPlugins(): Plugin<TProps, TData>[];
  /** 依赖解析 + 优先级排序后的执行顺序 */
  getExecutionOrder(): Plugin<TProps, TData>[];
  enable(name: string): void;
  disable(name: string): void;
  has(name: string): boolean;
  /** 返回 false 中断链；返回其他值短路返回 */
  executeHook<K extends keyof PluginHooks<TProps, TData>>(
    hookName: K,
    context: PluginContext<TProps, TData>,
    ...args: unknown[]
  ): Promise<unknown>;
  /** 清空全部插件；返回 Promise，await 后异步 destroy 全部完成 */
  clear(): Promise<void>;
  /** 沙箱累计错误（可上报） */
  getErrors(): Array<{ plugin: string; hook: string; error: unknown }>;
}

// ---------- withPlugins ----------

export interface WithPluginsConfig<TProps = unknown> {
  plugins: Plugin<TProps>[];
  enableDebug?: boolean;
  displayName?: string;
}
