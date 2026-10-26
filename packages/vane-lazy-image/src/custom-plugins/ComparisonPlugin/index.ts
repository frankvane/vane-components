/**
 * ComparisonPlugin — 对比标识覆盖层：标注图片处于对比模式（轻量占位实现）。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createComparisonPlugin as create } from "./create";
import type { ComparisonConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createComparisonPlugin: LazyImagePluginCreator<ComparisonConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ComparisonConfig>;

export type { ComparisonConfig };
