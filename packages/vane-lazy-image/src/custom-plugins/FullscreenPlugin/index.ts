/**
 * FullscreenPlugin — 全屏切换（gallery 增强插件）。文档数据见同目录 doc.json。
 */
import { createFullscreenPlugin as create } from "./create";
import type { FullscreenConfig } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createFullscreenPlugin: GalleryPluginCreator<FullscreenConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<FullscreenConfig>;

export type { FullscreenConfig };
