/**
 * CropPlugin — 焦点裁剪：通过 objectPosition 将裁剪焦点设在指定相对坐标。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createCropPlugin as create } from "./create";
import type { CropPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createCropPlugin: LazyImagePluginCreator<CropPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<CropPluginConfig>;

export type { CropPluginConfig };
