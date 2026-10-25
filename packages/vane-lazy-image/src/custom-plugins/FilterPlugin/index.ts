/**
 * FilterPlugin — CSS 滤镜：灰度/复古/亮度/对比度/饱和度，悬停可恢复原图。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createFilterPlugin as create } from "./create";
import type { FilterPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createFilterPlugin: LazyImagePluginCreator<FilterPluginConfig> = Object.assign(create, {
  meta: doc,
});

export type { FilterPluginConfig };
export { FILTER_PRESETS } from "./create";
