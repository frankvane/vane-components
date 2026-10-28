/**
 * ThumbPreloadPlugin — 相邻图预加载（gallery 增强插件）。文档数据见同目录 doc.json。
 */
import { createThumbPreloadPlugin as create } from "./create";
import type { ThumbPreloadConfig } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createThumbPreloadPlugin: GalleryPluginCreator<ThumbPreloadConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<ThumbPreloadConfig>;

export type { ThumbPreloadConfig };
