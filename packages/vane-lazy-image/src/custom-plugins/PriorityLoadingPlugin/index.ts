/**
 * PriorityLoadingPlugin — 优先级加载：按 high/medium/low 切换 eager/lazy 与 rootMargin。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createPriorityLoadingPlugin as create } from "./create";
import type { PriorityLoadingConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createPriorityLoadingPlugin: LazyImagePluginCreator<PriorityLoadingConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<PriorityLoadingConfig>;

export type { PriorityLoadingConfig };
