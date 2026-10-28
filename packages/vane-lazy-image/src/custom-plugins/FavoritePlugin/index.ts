/**
 * FavoritePlugin — 收藏切换（gallery 增强插件）。文档数据见同目录 doc.json。
 */
import { createFavoritePlugin as create } from "./create";
import type { FavoriteConfig } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createFavoritePlugin: GalleryPluginCreator<FavoriteConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<FavoriteConfig>;

export type { FavoriteConfig };
