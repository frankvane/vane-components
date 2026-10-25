/**
 * GalleryPlugin — 画廊灯箱：图片上叠加打开按钮，进入灯箱或新窗口查看原图。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createGalleryPlugin as create } from "./create";
import type { GalleryPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createGalleryPlugin: LazyImagePluginCreator<GalleryPluginConfig> = Object.assign(create, {
  meta: doc,
});

export type { GalleryPluginConfig };
