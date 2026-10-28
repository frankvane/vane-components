/**
 * vane-lazy-image/gallery —— 商品图集引擎子特性入口。
 *
 * 经独立子路径暴露，不进根桶（B7：保护根入口 28KB 预算）。
 * 体积约定见 package.json 的 vane.gallerySizeBudgetKb / gallerySizeBudgetNote。
 */

export { GalleryCore } from "./GalleryCore";
export { createGallery } from "./createGallery";
export type { CreateGalleryOptions } from "./createGallery";
export { useGalleryRuntime } from "./useGalleryRuntime";
export type { GalleryRuntime } from "./useGalleryRuntime";
export { renderGallerySlot } from "./slots";
export type { GallerySlotName } from "./slots";
export { galleryPreset } from "./presets/gallery";
export type {
  GalleryImage,
  GalleryContext,
  GalleryHooks,
  GalleryPlugin,
  GalleryPluginCreator,
  GalleryCoreProps,
  GalleryCoreRef,
} from "./types";
