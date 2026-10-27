/**
 * FilePreviewPlugin 领域类型（P2 迁移后）
 *
 * 复用 `vane-plugin-core` 的内核作为执行层，这里只声明「文件预览领域」的差异。
 *
 * ## 钩子面：17 → 11
 *
 * 迁移前 17 个钩子里有 10 个是**空转**的（全库 0 个实现，装配层却每次渲染都遍历调用）：
 *   onBeforeLoad / onLoadProgress / onDownload / onZoom / onRotate / onFullscreen
 *   onMount / onUnmount / renderOverlay / transformData
 * 其中后 4 个是内核已有的能力，不是领域能力 —— 由内核驱动，领域层只重声明签名。
 *
 * 保留的 11 个，按「谁驱动」分成两组：
 *
 *   领域 6（文件预览独有，由 withPlugins 直接调）
 *     canHandle(file)            路由：这个插件认不认这个文件
 *     render(ctx)                正文：赢家渲染什么
 *     renderToolbar(ctx)         工具栏（桥接到内核 renderHeader）
 *     onLoadStart / onLoadSuccess / onLoadError
 *
 *   内核 5（重声明为领域 context，语义不变）
 *     onMount / onUnmount        生命周期，内核 executeHook + clear 驱动
 *     renderOverlay              叠加层，内核插槽驱动
 *     transformData              数据改写，内核驱动
 *     onError                    错误，内核沙箱与边界驱动
 *
 * 另有 1 个**逃生口**不走钩子面：`priorityOf(file)`。
 * 17 个插件里只有 OfficePreviewPlugin 需要它 —— 它的优先级取决于
 * `config.preferDocxOnline` **并且**只在 .docx 上生效（提到 9），其余类型仍是 7。
 * 声明式的 `priority` 表达不了「按文件算」，而把 9 写死会抢走 xlsx 的 XlsxPreviewPlugin。
 * 其余 15 个常量优先级的插件在 P3 统一改成声明式 `priority`。
 */

import type React from "react";
import type { FilePreviewCoreProps } from "../core/FilePreviewCore";

// ============ 文件 ============

export interface FileInfo {
  name: string;
  size: number;
  /** MIME type */
  type: string;
  extension: string;
  url: string;
  lastModified?: number;
  /** 在线或离线预览 */
  previewMode?: "online" | "offline";
  /** DOCX 离线预览走哪个实现；两个插件各自在 canHandle 里读，不再由 demo 决定 */
  docxMode?: "mammoth" | "docx-preview";
}

export interface PreviewDimensions {
  width: number;
  height: number;
}

export interface PreviewProgress {
  loaded: number;
  total: number;
  percent: number;
  indeterminate?: boolean;
}

// ============ 状态 ============

export type PreviewState =
  | "idle"
  | "loading"
  | "loaded"
  | "error"
  | "unsupported";

export interface PreviewStateInfo {
  state: PreviewState;
  error?: Error;
  message?: string;
}

/** 插件上报状态用的补丁：Core 是唯一真源，插件只允许「上报我这一步的结果」 */
export type PreviewStatePatch = Partial<PreviewStateInfo>;

// ============ 总线与设备 ============

/**
 * 插件总线。
 *
 * 自带声明而不从 `vane-plugin-core` re-export：内核是**构建时内联**的实现细节，
 * 未发布到 npm。公开 d.ts 里若出现 `import type { PluginBus } from "vane-plugin-core"`，
 * 消费方装包后 TS 直接报 Cannot find module。
 * 形状与内核完全一致（结构类型），运行时可互换赋值。
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

export interface PluginLogger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

// ============ 插件上下文 ============

/**
 * 文件预览插件上下文。
 *
 * `state` 是 Core 状态的**只读镜像**（由 Core 的 `onStateChange` 单向推下来），
 * 想改状态必须走 `reportState` —— 它转发给 Core，由 Core 落库。
 * 这条边界是 P1 收敛的重点：迁移前 Core 与 withPlugins 各存一份 state，
 * 两边各 setState，谁也不知道对方改了什么。
 */
export interface FilePreviewPluginContext {
  props: FilePreviewCoreProps;
  file: FileInfo;
  /** Core 的加载状态（只读镜像） */
  state: PreviewStateInfo;
  /** 上报状态（唯一写入路径，转发给 Core） */
  reportState: (patch: PreviewStatePatch) => void;

  containerRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;

  /** 跨插件共享（不触发渲染） */
  sharedData: Map<string, unknown>;
  bus: PluginBus;
  deviceInfo: DeviceInfo;
  forceUpdate: () => void;
  getSize: () => PreviewDimensions;
  logger: PluginLogger;
}

// ============ 钩子 ============

export interface FilePreviewPluginHooks {
  // ===== 领域 · 路由 =====
  /** 这个插件能不能处理这个文件。返回 false / undefined 表示不认 */
  canHandle?: (file: FileInfo) => boolean;
  /** 逃生口：按文件算优先级，覆盖声明式 `priority`。仅 OfficePreviewPlugin 需要 */
  priorityOf?: (file: FileInfo) => number;

  // ===== 领域 · 渲染 =====
  render?: (context: FilePreviewPluginContext) => React.ReactNode;
  /** 工具栏；withPlugins 会桥接到内核的 renderHeader，落到 Core 内容区顶部 */
  renderToolbar?: (context: FilePreviewPluginContext) => React.ReactNode;

  // ===== 领域 · 加载结果 =====
  onLoadStart?: (context: FilePreviewPluginContext) => void;
  onLoadSuccess?: (context: FilePreviewPluginContext) => void;
  onLoadError?: (context: FilePreviewPluginContext, error: Error) => void;

  // ===== 内核 · 生命周期（由内核驱动，这里重声明成领域 context）=====
  onMount?: (context: FilePreviewPluginContext) => void | (() => void);
  onUnmount?: (context: FilePreviewPluginContext) => void;

  // ===== 内核 · 叠加层 =====
  renderOverlay?: (context: FilePreviewPluginContext) => React.ReactNode;

  // ===== 内核 · 数据改写 =====
  transformData?: (context: FilePreviewPluginContext, data: FileInfo) => FileInfo;

  // ===== 内核 · 错误 =====
  onError?: (
    context: FilePreviewPluginContext,
    error: Error,
    errorInfo?: React.ErrorInfo
  ) => void;
}

// ============ 插件定义 ============

export interface FilePreviewPlugin {
  /** 唯一标识，PascalCase（与 vane-card 的插件命名一致） */
  name: string;
  version?: string;
  description?: string;

  /** 支持的 MIME types，支持 `image/*` 通配 */
  supportedTypes?: string[];
  /** 支持的扩展名，带点：`[".pdf"]` */
  supportedExtensions?: string[];

  /** 越大越优先。默认 0；DownloadPlugin 是 -1（兜底） */
  priority?: number;

  hooks: FilePreviewPluginHooks;
  config?: Record<string, any>;

  /** 依赖的插件名，先注册依赖再注册自己 */
  dependencies?: string[];
  enabled?: boolean;

  init?: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

/** 插件工厂 */
export type FilePreviewPluginCreator<Config = any> = (
  config?: Config
) => FilePreviewPlugin;

/** withPlugins 配置 */
export interface WithPluginsConfig {
  plugins: FilePreviewPlugin[];
  enableDebug?: boolean;
}
