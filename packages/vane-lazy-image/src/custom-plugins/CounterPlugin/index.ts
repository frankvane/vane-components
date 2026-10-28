/**
 * CounterPlugin — 图片计数指示器（gallery 增强插件）。文档数据见同目录 doc.json。
 */
import { createCounterPlugin as create } from "./create";
import type { CounterConfig } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createCounterPlugin: GalleryPluginCreator<CounterConfig> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<CounterConfig>;

export type { CounterConfig };
