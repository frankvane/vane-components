/**
 * createGallery —— 图集工厂（便捷封装）。
 *
 * 多数场景直接 <GalleryCore images={...} /> 即可；createGallery 用于把一组固定的
 * 主图插件 / gallery 域插件预设固化成一个可复用的 Gallery 组件。
 */

import React, { forwardRef } from "react";
import type { LazyImagePlugin } from "../components/LazyLoadImagePlugin/plugins/types";
import { GalleryCore } from "./GalleryCore";
import type { GalleryCoreProps, GalleryCoreRef, GalleryPlugin } from "./types";

export interface CreateGalleryOptions {
  /** 主图实例上的单图插件（放大镜/视频位/灯箱 …） */
  mainPlugins?: LazyImagePlugin[];
  /** gallery 域插件；缺省用 galleryPreset() */
  plugins?: GalleryPlugin[];
}

export function createGallery(options: CreateGalleryOptions = {}) {
  const Gallery = forwardRef<GalleryCoreRef, GalleryCoreProps>((props, ref) => (
    <GalleryCore
      {...props}
      mainPlugins={props.mainPlugins ?? options.mainPlugins}
      plugins={props.plugins ?? options.plugins}
      ref={ref}
    />
  ));
  Gallery.displayName = "Gallery";
  return Gallery;
}
