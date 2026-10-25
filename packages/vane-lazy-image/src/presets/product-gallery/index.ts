/**
 * 配方：商品画廊（product-gallery）
 *
 * 场景：电商商品图，重视觉细节与浏览体验，CLS 敏感（价格/按钮不能跳动）。
 * 组合思路：
 *   - AspectRatioSpacer：按比例预留空间，图片加载不引起布局抖动；
 *   - BlurUp + Skeleton：占位双层保险（模糊占位 + 骨架动画）；
 *   - Gallery：图片上提供打开入口，进入灯箱查看大图；
 *   - HoverZoom：悬停放大查看细节；
 *   - Caption：图片说明（如商品卖点）常驻显示。
 *
 * 用法：withPlugins(LazyLoadImageCore, productGalleryPreset())
 */
import { createAspectRatioSpacerPlugin } from "../../custom-plugins/AspectRatioSpacerPlugin";
import { createBlurUpPlugin } from "../../custom-plugins/BlurUpPlugin";
import { createSkeletonPlugin } from "../../custom-plugins/SkeletonPlugin";
import { createGalleryPlugin } from "../../custom-plugins/GalleryPlugin";
import { createHoverZoomPlugin } from "../../custom-plugins/HoverZoomPlugin";
import { createCaptionPlugin } from "../../custom-plugins/CaptionPlugin";
import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export const productGalleryPreset = (): LazyImagePlugin[] => [
  createAspectRatioSpacerPlugin(),
  createBlurUpPlugin(),
  createSkeletonPlugin(),
  createGalleryPlugin(),
  createHoverZoomPlugin(),
  createCaptionPlugin(),
];
