/**
 * ColorExtractionPlugin — 主色提取：canvas 采样图片主色，可设置容器背景或显示色卡。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createColorExtractionPlugin as create } from "./create";
import type { ColorExtractionConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createColorExtractionPlugin: LazyImagePluginCreator<ColorExtractionConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ColorExtractionConfig>;

export type { ColorExtractionConfig };
