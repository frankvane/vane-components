/**
 * ImageOptimizationPlugin — 图片优化：自动追加宽度/质量/格式查询参数。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createImageOptimizationPlugin as create } from "./create";
import type { ImageOptimizationPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createImageOptimizationPlugin: LazyImagePluginCreator<ImageOptimizationPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ImageOptimizationPluginConfig>;

export type { ImageOptimizationPluginConfig };
