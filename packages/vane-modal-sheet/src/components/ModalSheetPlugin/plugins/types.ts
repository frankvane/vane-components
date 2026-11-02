import type React from "react";
import type { Plugin, PluginContext, PluginCreator, PluginDoc, PluginHooks, WithPluginsConfig } from "vane-plugin-core";
import type { SheetDetent, SheetEngineState, SheetPlacement } from "../engine";

/**
 * 领域类型：核心组件 props / ref + 领域钩子。
 * 铁律：
 *  - 时基值（progress / currentSnap / height / viewportInset）一律 getter，不做快照；
 *  - 几何唯一决策者是内核，插件只能通过 snapTo / setViewportInset 影响 transform；
 *  - 领域钩子用「方法语法」声明（参数双变，允许领域 context 收窄）。
 */

/** 拖拽面注册：插件把 getDragProps() spread 到自己的元素上即成为拖拽面 */
export interface ModalSheetDragProps {
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
  "data-vane-ms-drag"?: string;
}

/** 内核引擎回调桥（HOC 注入；裸用 Core 时回退到 props 上的用户回调） */
export interface ModalSheetEngineCallbacks {
  onSnap?(index: number): void;
  onOpen?(): void;
  /** fromExternal = 由父级受控关闭触发（用户 onClose 不再重复回调） */
  onClose?(fromExternal?: boolean): void;
}

export interface ModalSheetCoreProps {
  /** 受控开关；false 时整个弹层不渲染（关闭动画由内核先补间完再回调 onClose） */
  isOpen: boolean;
  /** 关闭回调（拖拽关闭 / close() / 插件触发，统一走这里） */
  onClose?: () => void;
  /**
   * 抽伸方位（默认 "bottom"）。
   * bottom/top 沿视口高抽伸，snapPoints 比例按视口高折算；
   * left/right 沿视口宽抽伸，snapPoints 比例按视口宽折算（宽度即档位尺寸）。
   */
  placement?: SheetPlacement;
  /** 吸附点，升序；0–1 = 抽伸轴尺寸比例（纵向视口高 / 横向视口宽），>1 = 像素 */
  snapPoints?: number[];
  /** 初始吸附档索引（默认 0 = 最高档） */
  initialSnap?: number;
  /** 尺寸语义：default=按 snapPoints / content=按内容尺寸 / full=满抽伸轴 */
  detent?: SheetDetent;
  /** 快速下滑关闭速度阈值（px/s，默认 500） */
  dragVelocityThreshold?: number;
  /** 拖出比例关闭阈值（0–1，默认 0.6） */
  dragCloseThreshold?: number;
  /** 补间时长 ms（默认 240） */
  tweenDuration?: number;
  /** 跳过动画（无障碍） */
  prefersReducedMotion?: boolean;
  /** 弹层根节点 z-index（默认 1000） */
  zIndex?: number;
  /** 面板宽度（仅 bottom/top；px 数字或任意 CSS 宽度；默认 "100%" 全宽） */
  width?: number | string;
  /**
   * 面板最大高度；不设时无上限。
   * bottom/top：限制主尺寸（高度）；left/right：限制交叉轴高度（水平垂直居中）。
   * 支持数字（px）、"480px"、"72vh"、"80%"。
   */
  maxHeight?: number | string;
  /** 无障碍名称（二者都空时不写 aria 属性） */
  ariaLabel?: string;
  /** 关联标题元素的 id（与 HeaderPlugin 的 titleId 配套） */
  ariaLabelledby?: string;
  /** 面板水平停靠（仅 bottom/top；默认 "center"；width 不为全宽时生效） */
  horizontalAlign?: "left" | "center" | "right";
  /** 吸附/打开/关闭事件（HOC 会在此之上再跑插件钩子链） */
  onSnap?: (index: number) => void;
  onOpen?: () => void;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  /** 面板内联样式覆盖（background/color/radius 等 token） */
  panelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由 HOC 注入：插件经 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
  /** 由 HOC 注入：共享可变引擎状态（时基值真源） */
  sheetState?: SheetEngineState;
  /** 由 HOC 注入：插件生命周期桥 */
  engineCallbacks?: ModalSheetEngineCallbacks;
  children?: React.ReactNode;
}

export interface ModalSheetCoreRef {
  getContainer(): HTMLDivElement | null;
  getPanel(): HTMLDivElement | null;
  forceUpdate(): void;
  snapTo(index: number): void;
  close(): void;
  getProgress(): number;
  getCurrentSnap(): number;
  setViewportInset(px: number): void;
  getDragProps(): ModalSheetDragProps;
}

/** 领域上下文：内核 context + 时基 getter + 几何命令 */
export interface ModalSheetPluginContext extends PluginContext<ModalSheetCoreProps> {
  /** 0–1 打开进度（拖拽中逐帧更新） */
  readonly progress: number;
  /** 当前吸附档索引 */
  readonly currentSnap: number;
  /** 当前面板可见高度 px */
  readonly height: number;
  /** 键盘等占用的视口 inset px */
  readonly viewportInset: number;
  /** 吸附档数 */
  readonly snapCount: number;
  snapTo(index: number): void;
  close(): void;
  getPanel(): HTMLDivElement | null;
  getDragProps(): ModalSheetDragProps;
  /** 键盘避让等场景：告诉内核视口被占用了多少（内核重算吸附档） */
  setViewportInset(px: number): void;
}

/** 领域钩子（方法语法） */
export interface ModalSheetPluginHooks extends PluginHooks<ModalSheetCoreProps> {
  /** 遮罩槽（backdrop 专用，内核通用层没有这个槽） */
  renderBackdrop?(context: ModalSheetPluginContext): React.ReactNode;
  /** 拖拽把手槽（handle 专用） */
  renderHandle?(context: ModalSheetPluginContext): React.ReactNode;
  /** 吸附到某档后触发（含打开补间结束） */
  onSnap?(context: ModalSheetPluginContext, index: number): unknown;
  /** 打开补间完成后触发 */
  onOpen?(context: ModalSheetPluginContext): unknown;
  /** 关闭补间完成后触发 */
  onClose?(context: ModalSheetPluginContext): unknown;
}

export type ModalSheetPlugin<T = any> = Plugin<ModalSheetCoreProps, T> & {
  hooks: ModalSheetPluginHooks;
};

/**
 * 领域插件工厂：返回值挂钩领域钩子接口（renderBackdrop / onSnap …），
 * 内核通用 PluginCreator 只会给通用 PluginHooks，领域钩子会掉进索引签名丢类型。
 */
export type ModalSheetPluginCreator<Config = any> = {
  (config?: Config): ModalSheetPlugin;
  meta: PluginDoc;
};

export type ModalSheetWithPluginsConfig = WithPluginsConfig<ModalSheetCoreProps>;

export type { PluginDoc, SheetDetent, SheetEngineState, SheetPlacement };
