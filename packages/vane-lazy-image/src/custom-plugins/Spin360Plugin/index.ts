/**
 * Spin360Plugin — 360° 环物旋转（gallery 核心插件）。文档数据见同目录 doc.json。
 */
import { createSpin360Plugin as create } from "./create";
import type { Spin360Config } from "./create";
import doc from "./doc.json";
import type { GalleryPluginCreator } from "../../gallery/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createSpin360Plugin: GalleryPluginCreator<Spin360Config> =
  Object.assign(create, { meta: doc }) as GalleryPluginCreator<Spin360Config>;

export type { Spin360Config };
