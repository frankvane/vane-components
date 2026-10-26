/**
 * vane-lazy-image 领域插件类型。
 *
 * 规则：通用能力（Plugin / PluginContext / PluginBus / PluginManager / 生命周期钩子语义）
 * 一律从 @vane/plugin-core 派生，本文件只定义图片领域扩展：
 *   - LazyImageContext：领域上下文（src / imageState / isIntersecting / imageRef …）
 *   - LazyImageHooks：领域钩子表（onBeforeLoad / onLoad / onLoadSuccess …）
 *   - LazyImagePlugin：领域插件（hooks 为 LazyImageHooks）
 *
 * ⚠️ priority 语义：领域层沿用「数字越小越优先，默认 100」，
 * withPlugins 装配时会转换为内核的「越大越优先」，插件源码不需要关心差异。
 */

import type React from "react";
import type {
  DeviceInfo,
  Plugin,
  PluginBus,
  PluginContext,
  PluginCreator,
  PluginDoc,
  PluginHooks,
} from "@vane/plugin-core";
import type { LazyLoadImageCoreProps, ImageState } from "../LazyLoadImageCore";

// ---------- 领域数据类型 ----------

export interface ProgressInfo {
  loaded: number;
  total: number;
  percent: number; // 0~100
  indeterminate?: boolean;
  /** 下载速度（字节/秒） */
  speed?: number;
  /** 预计剩余时间（秒） */
  estimatedTime?: number;
  /** 时间戳（毫秒） */
  timestamp?: number;
}

export interface NetworkInfo {
  effectiveType: "4g" | "3g" | "2g" | "slow-2g";
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

export interface Dimensions {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

export type InteractionType = "click" | "hover" | "focus" | "touch";

/** 插件可读的图片领域数据（随加载状态推进） */
export interface LazyImageData {
  displaySrc: string | null;
  status: "idle" | "loading" | "loaded" | "error";
  error: Error | null;
}

// ---------- 领域上下文 ----------

/**
 * 领域插件上下文 = 内核上下文 & 图片领域字段。
 * withPlugins 执行钩子时传入本类型的实例。
 */
export interface LazyImageContext
  extends PluginContext<LazyLoadImageCoreProps, LazyImageData> {
  /** 当前图片地址 */
  src: string;
  /** 图片加载状态（与 Core 内部状态同步） */
  imageState: ImageState;
  /** 是否处于视口内 */
  isIntersecting: boolean;
  /** 图片 DOM 引用 */
  imageRef: React.RefObject<HTMLImageElement | null>;
  /** 容器 DOM 引用 */
  containerRef: React.RefObject<HTMLElement | null>;
  /** 网络信息（全局单例，见 utils/GlobalContext） */
  networkInfo?: NetworkInfo;
  /** 跨插件共享数据（内核 context.shared 的领域别名，由 withPlugins 注入）。
   *  与旧版领域 API 一致保持 Map<string, any>：存量插件直接做算术/赋值，
   *  新插件读写建议先断言类型（内核侧 shared 为 Map<string, unknown>） */
  sharedData: Map<string, any>;
  /** 尺寸信息 */
  dimensions?: Dimensions;
  /** 性能计时数据 */
  performanceData?: {
    loadStartTime: number;
    loadEndTime?: number;
    duration?: number;
    size?: number;
  };
  /** 插件自身配置（createXxxPlugin(config) 传入的那个对象） */
  config?: Record<string, any>;
  /** 重新加载：会先中止在途请求，再（若仍在视口）重新发起加载 */
  reload?(): void;
  /** 重置：回到初始 idle 状态，不重新发起加载（用于「离开即中止」等场景） */
  reset?(): void;
}

// ---------- 领域钩子表 ----------

/**
 * 图片领域钩子。通用钩子（onMount / onUnmount / onPropsChange / onError /
 * transformProps / transformData / renderOverlay / renderHeader / renderFooter）
 * 在这里以「方法语法」重新声明，把 context 收窄为领域上下文 LazyImageContext——
 * 插件源码里未显式标注 context 类型的钩子（如 renderOverlay(context) {...}）
 * 经上下文类型自动获得领域字段；同时加载/视口/交互领域钩子在此声明。
 *
 * 与内核一致用方法语法（参数双变），context 统一为领域上下文 LazyImageContext。
 * 返回值语义与内核一致：false 中断链；其他值短路返回；undefined 继续。
 */
export interface LazyImageHooks
  extends PluginHooks<LazyLoadImageCoreProps, LazyImageData> {
  // ---------- 内核通用钩子的领域化重声明（context 收窄） ----------
  onMount?(context: LazyImageContext): unknown;
  onUnmount?(context: LazyImageContext): unknown;
  onPropsChange?(
    context: LazyImageContext,
    prev: LazyLoadImageCoreProps,
    next: LazyLoadImageCoreProps
  ): unknown;
  onError?(
    context: LazyImageContext,
    error: Error,
    errorInfo?: React.ErrorInfo
  ): unknown;
  transformProps?(props: LazyLoadImageCoreProps): LazyLoadImageCoreProps;
  transformData?(context: LazyImageContext, data: LazyImageData): LazyImageData;
  renderOverlay?(context: LazyImageContext): React.ReactNode;
  renderHeader?(context: LazyImageContext): React.ReactNode;
  renderFooter?(context: LazyImageContext): React.ReactNode;

  // ---------- 图片领域钩子 ----------
  /** 加载前触发，返回 false 阻止加载 */
  onBeforeLoad?(context: LazyImageContext): boolean | Promise<boolean>;
  /** 自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原 URL） */
  onLoad?(
    context: LazyImageContext
  ): string | Promise<string | undefined> | undefined;
  /** 加载成功，displaySrc 为最终显示的图片源 */
  onLoadSuccess?(
    context: LazyImageContext,
    displaySrc: string
  ): void | Promise<void>;
  /** 加载失败，返回 true 表示已处理错误 */
  onLoadError?(
    context: LazyImageContext,
    error: Error | Event
  ): boolean | Promise<boolean>;
  /** 进入视口 */
  onEnterViewport?(
    context: LazyImageContext,
    entry?: IntersectionObserverEntry
  ): void;
  /** 离开视口 */
  onLeaveViewport?(
    context: LazyImageContext,
    entry?: IntersectionObserverEntry
  ): void;
  /** 加载进度更新（由 withPlugins 订阅 bus "progress" 事件桥接） */
  onProgress?(context: LazyImageContext, progress: ProgressInfo): void;
  /** 重试加载 */
  onRetry?(
    context: LazyImageContext,
    retryCount: number,
    maxRetries: number
  ): void;
  /** src 变化 */
  onSrcChange?(
    context: LazyImageContext,
    oldSrc: string,
    newSrc: string
  ): void;
  /** 网络状态变化 */
  onNetworkChange?(context: LazyImageContext): void;
  /** 可见性变化 */
  onVisibilityChange?(context: LazyImageContext, isVisible: boolean): void;
  /** 尺寸变化（窗口 resize / 设备方向变化） */
  onResize?(context: LazyImageContext): void;
  /** 用户交互 */
  onInteraction?(
    context: LazyImageContext,
    interactionType: InteractionType
  ): void;
  /** 加载中断 */
  onAbort?(context: LazyImageContext): void;
  /** 图片解码完成 */
  onDecode?(context: LazyImageContext): void;
  /** 图片绘制到页面 */
  onPaint?(context: LazyImageContext): void;
}

// ---------- 领域插件 ----------

/** 领域插件：hooks 为 LazyImageHooks，priority 沿用「越小越优先」领域语义 */
export interface LazyImagePlugin
  extends Plugin<LazyLoadImageCoreProps, LazyImageData> {
  hooks: LazyImageHooks;
  /** 领域优先级：数字越小越优先，默认 100（由 withPlugins 转换为内核语义） */
  priority?: number;
}

/** 领域插件工厂（可调用 + 挂 .meta，供文档生成与 demo 导航使用） */
export type LazyImagePluginCreator<Config = any> = PluginCreator<
  Config,
  LazyLoadImageCoreProps,
  LazyImageData
>;

// ---------- 事件表（bus 类型提示用） ----------

export interface LazyImageBusEvents {
  "image:load": { src: string; timestamp: number };
  "image:error": { src: string; error: Error };
  "image:progress": { src: string; progress: ProgressInfo };
  "viewport:enter": { src: string; entry?: IntersectionObserverEntry };
  "viewport:leave": { src: string; entry?: IntersectionObserverEntry };
  "network:change": { networkInfo: NetworkInfo };
}

/** 领域总线（内核 PluginBus 的别名，保留旧名称兼容） */
export type LazyImagePluginBus = PluginBus;

// ---------- 重导出（保持对外 API 名称稳定） ----------

export type {
  DeviceInfo,
  PluginBus,
  PluginContext,
  PluginDoc,
  PluginHooks,
  LazyLoadImageCoreProps,
  ImageState,
};
