/**
 * HoverPrefetchPlugin — 悬停预取：鼠标悬停/触摸时预取下一张图片，支持去重。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createHoverPrefetchPlugin as create } from "./create";
import type { HoverPrefetchConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createHoverPrefetchPlugin: LazyImagePluginCreator<HoverPrefetchConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<HoverPrefetchConfig>;

export type { HoverPrefetchConfig };
