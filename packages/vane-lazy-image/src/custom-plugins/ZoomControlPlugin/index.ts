/**
 * ZoomControlPlugin — 按钮式缩放控制（gallery 增强插件）。文档数据见同目录 doc.json。
 */
import { createZoomControlPlugin as create } from "./create";
import type { ZoomControlConfig } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createZoomControlPlugin: GalleryPluginCreator<ZoomControlConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<ZoomControlConfig>;

export type { ZoomControlConfig };
