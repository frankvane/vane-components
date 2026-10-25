/**
 * ViewportAwarePlugin — 视口状态可视化：显示进入/离开指示点并给 DOM 打标记。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createViewportAwarePlugin as create } from "./create";
import type { ViewportAwareConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createViewportAwarePlugin: LazyImagePluginCreator<ViewportAwareConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ViewportAwareConfig>;

export type { ViewportAwareConfig };
