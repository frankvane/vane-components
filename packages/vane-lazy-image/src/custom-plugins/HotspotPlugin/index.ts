/**
 * HotspotPlugin — 主图热点标注（gallery 增强插件）。文档数据见同目录 doc.json。
 */
import { createHotspotPlugin as create } from "./create";
import type { HotspotConfig, Hotspot } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createHotspotPlugin: GalleryPluginCreator<HotspotConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<HotspotConfig>;

export type { HotspotConfig, Hotspot };
