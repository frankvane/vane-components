/**
 * ColorSwatchPlugin — 颜色选择器：自动提取商品图片主要颜色，支持交互选择与颜色代码显示。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createColorSwatchPlugin as create } from "./create";
import type { ColorSwatchPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createColorSwatchPlugin: LazyImagePluginCreator<ColorSwatchPluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<ColorSwatchPluginConfig>;

export type { ColorSwatchPluginConfig };
