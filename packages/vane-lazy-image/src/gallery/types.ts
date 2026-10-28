/**
 * vane-gallery 领域类型（lazy-image 子特性，B1-B 并入）。
 *
 * GalleryContext 在 vane-plugin-core 的 PluginContext 上追加图集协调态：
 *   activeIndex / setActiveIndex  —— 当前主图索引（缩略联动 / 轮播 / 指示点共用）
 *   frameIndex / setFrameIndex    —— 360° 环物当前帧
 *   zoom / setZoom                —— 缩放比例（按钮式缩放控制）
 *   favorited / setFavorited      —— 收藏态
 * 这些字段由 useGalleryRuntime 通过 extendContext 注入；变更即触发 GalleryCore 重渲染，
 * 因而所有 gallery 域插件（缩略条 / 计数 / 指示点 / 缩放 …）同步刷新——这是「缩略联动」
 * 能刷新主图的根本机制（区别于 vane-waterfall 需要手动 forceUpdate 的闭包态）。
 */

import type React from "react";
import type {
  Plugin,
  PluginContext,
  PluginDoc,
  PluginCreator,
  PluginHooks,
} from "vane-plugin-core";
import type { LazyImagePlugin } from "../components/LazyLoadImagePlugin/plugins/types";

/** 图集中的单张图（主图或 360 帧共用此结构） */
export interface GalleryImage {
  src: string;
  alt?: string;
  /** 缩略图地址；缺省回退到 src */
  thumbnail?: string;
}

/** Gallery 域插件的上下文（内核 context + 图集协调态） */
export interface GalleryContext extends PluginContext<any, any> {
  images: GalleryImage[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  frameIndex: number;
  setFrameIndex: (i: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  favorited: boolean;
  setFavorited: (v: boolean) => void;
}

/** Gallery 域插件的钩子表（内核通用钩子 + 图集领域渲染槽 + 领域事件） */
export interface GalleryHooks extends PluginHooks<any, any> {
  /** 缩略图区渲染（ThumbSync / Indicator） */
  galleryThumbArea?(ctx: GalleryContext): React.ReactNode;
  /** 工具条区渲染（Counter / ZoomControl / Favorite） */
  galleryToolbarArea?(ctx: GalleryContext): React.ReactNode;
  /** 浮层渲染（Fullscreen / Hotspot） */
  galleryOverlay?(ctx: GalleryContext): React.ReactNode;
  /** 主图区渲染（少数覆盖主图内容的插件，如 Spin360 自绘帧） */
  galleryMainArea?(ctx: GalleryContext): React.ReactNode;
  /** 主图切换事件（Carousel / ThumbPreload 监听） */
  onActiveChange?(ctx: GalleryContext, index: number): void;
  /** 360 帧切换事件 */
  onFrameChange?(ctx: GalleryContext, frame: number): void;
}

/** Gallery 域插件 */
export interface GalleryPlugin extends Plugin<any, any> {
  hooks: GalleryHooks;
}

/** Gallery 域插件工厂（可调用 + 挂 .meta） */
export type GalleryPluginCreator<Config = any> = PluginCreator<Config, any, any>;

/** GalleryCore 对外 props */
export interface GalleryCoreProps {
  images: GalleryImage[];
  /** 主图实例上挂载的单图插件（放大镜/视频位/灯箱/价格/促销 …）。不传则仅 Core 主图。 */
  mainPlugins?: LazyImagePlugin[];
  /** gallery 域插件（缩略联动/360/计数 …）。不传则用 galleryPreset() */
  plugins?: GalleryPlugin[];
  initialIndex?: number;
  /** 缩略条位置（默认 bottom） */
  thumbPosition?: "bottom" | "top" | "left" | "right";
  className?: string;
  style?: React.CSSProperties;
  /** 整体宽度，默认 100% */
  width?: number | string;
  /** 主图区高度，默认 360 */
  mainHeight?: number | string;
}

/** GalleryCore 命令式 ref */
export interface GalleryCoreRef {
  setActiveIndex: (i: number) => void;
  getActiveIndex: () => number;
}

export type { PluginDoc };
