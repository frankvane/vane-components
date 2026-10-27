/**
 * FilePreviewPlugin 插件系统类型定义
 *
 * ⚠️ P1 阶段原样迁入（仅改文件位置）。P2 会整体重写：
 *   - 钩子面 17 → 11（删掉 10 个「声明了但 0 个插件实现」的空转钩子）
 *   - `PluginContext` 继承 `@vane/plugin-core` 的上下文
 *   - 删掉恒为 undefined 的 `progress` / `dimensions`
 *   - `getPriority` 从函数改为声明式 `priority`（函数形态让路由没法静态分析）
 * 现在保留原样，是为了让 P1 的「Core 状态机收敛」与「插件系统替换」两件事互不干扰：
 * 一次只改一层，出问题能定位到是哪一层。改动计划见 tasks/14 P2.2。
 */

import type React from "react";

// ============ 文件信息类型 ============
export interface FileInfo {
  name: string;
  size: number;
  type: string; // MIME type
  extension: string;
  url: string;
  lastModified?: number;
  previewMode?: "online" | "offline"; // 预览模式：在线或离线
  docxMode?: "mammoth" | "docx-preview"; // DOCX 离线预览模式
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

// ============ 预览状态 ============
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

/**
 * 插件上报状态用的补丁。
 *
 * P1 新增：Core 是状态唯一真源，插件不许自己 `setState`，只允许「上报我这一步的结果」。
 * 允许只带 `message`（例如「正在解析第 3 页」）而不动 `state`，所以整体都是可选的。
 */
export type PreviewStatePatch = Partial<PreviewStateInfo>;

// ============ 插件通信总线 ============
export interface PluginBus {
  emit: (event: string, data: any) => void;
  on: (event: string, handler: (data: any) => void) => () => void;
  getData: (key: string) => any;
  setData: (key: string, value: any) => void;
}

// ============ 插件上下文 ============
export interface PluginContext {
  file: FileInfo;
  state: PreviewStateInfo;
  containerRef: React.RefObject<HTMLElement | null>;
  contentRef?: React.RefObject<HTMLElement | null>;
  bus?: PluginBus;

  // 扩展上下文
  dimensions?: PreviewDimensions;
  progress?: PreviewProgress;
  metadata?: Record<string, any>;
  sharedData?: Map<string, any>;
}

// ============ 插件钩子 ============
export interface PluginHooks {
  // 生命周期钩子
  onMount?: (context: PluginContext) => void | (() => void);
  onUnmount?: (context: PluginContext) => void;

  // 文件检测与支持
  canHandle?: (file: FileInfo) => boolean | Promise<boolean>;
  getPriority?: (file: FileInfo) => number; // 优先级，数字越大优先级越高

  // 加载钩子
  onBeforeLoad?: (context: PluginContext) => boolean | Promise<boolean>;
  onLoadStart?: (context: PluginContext) => void;
  onLoadProgress?: (context: PluginContext, progress: PreviewProgress) => void;
  onLoadSuccess?: (context: PluginContext) => void;
  onLoadError?: (
    context: PluginContext,
    error: Error
  ) => boolean | Promise<boolean>; // 返回 false 阻止默认错误处理

  // 预览渲染
  render?: (context: PluginContext) => React.ReactNode;
  renderToolbar?: (context: PluginContext) => React.ReactNode;
  renderOverlay?: (context: PluginContext) => React.ReactNode;

  // 数据转换
  transformData?: (context: PluginContext, data: any) => any | Promise<any>;

  // 交互钩子
  onDownload?: (context: PluginContext) => void | Promise<void>;
  onZoom?: (context: PluginContext, scale: number) => void;
  onRotate?: (context: PluginContext, angle: number) => void;
  onFullscreen?: (context: PluginContext, isFullscreen: boolean) => void;
}

// ============ 插件定义 ============
export interface FilePreviewPlugin {
  name: string;
  version?: string;
  description?: string;
  supportedTypes?: string[]; // 支持的 MIME types
  supportedExtensions?: string[]; // 支持的文件扩展名
  hooks: PluginHooks;
  config?: Record<string, any>;

  init?: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

// ============ 插件管理器 ============
export interface PluginManager {
  register: (plugin: FilePreviewPlugin) => void;
  unregister: (pluginName: string) => void;
  getPlugin: (pluginName: string) => FilePreviewPlugin | undefined;
  getAllPlugins: () => FilePreviewPlugin[];
  findPluginForFile: (file: FileInfo) => Promise<FilePreviewPlugin | null>;
  executeHook: <K extends keyof PluginHooks>(
    hookName: K,
    context: PluginContext,
    ...args: any[]
  ) => Promise<any>;
}
