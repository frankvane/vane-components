/**
 * WatermarkPlugin — 文字水印覆盖层：支持四角/中心定位、动态文本与样式定制。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createWatermarkPlugin as create } from "./create";
import type { WatermarkPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createWatermarkPlugin: LazyImagePluginCreator<WatermarkPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<WatermarkPluginConfig>;

export type { WatermarkPluginConfig };
