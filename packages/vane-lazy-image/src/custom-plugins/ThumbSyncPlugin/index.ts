/**
 * ThumbSyncPlugin — 缩略图联动（gallery 核心插件）。文档数据见同目录 doc.json。
 */
import { createThumbSyncPlugin as create } from "./create";
import type { ThumbSyncConfig } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createThumbSyncPlugin: GalleryPluginCreator<ThumbSyncConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<ThumbSyncConfig>;

export type { ThumbSyncConfig };
