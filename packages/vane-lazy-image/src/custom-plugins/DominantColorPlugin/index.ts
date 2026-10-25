/**
 * DominantColorPlugin — 主色占位：从 LQIP 采样平均色填充容器背景，减少白屏。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createDominantColorPlugin as create } from "./create";
import type { DominantColorConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createDominantColorPlugin: LazyImagePluginCreator<DominantColorConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<DominantColorConfig>;

export type { DominantColorConfig };
