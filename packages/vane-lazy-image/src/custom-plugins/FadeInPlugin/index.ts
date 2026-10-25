/**
 * FadeInPlugin — 加载完成后淡入显示，可自定义时长与缓动函数。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createFadeInPlugin as create } from "./create";
import type { FadeInConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createFadeInPlugin: LazyImagePluginCreator<FadeInConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<FadeInConfig>;

export type { FadeInConfig };
