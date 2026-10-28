/**
 * CarouselPlugin — 自动轮播（gallery 增强插件）。文档数据见同目录 doc.json。
 */
import { createCarouselPlugin as create } from "./create";
import type { CarouselConfig } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createCarouselPlugin: GalleryPluginCreator<CarouselConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<CarouselConfig>;

export type { CarouselConfig };
