/**
 * ParallaxPlugin — 视差滚动：随页面滚动按强度偏移图片位置。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createParallaxPlugin as create } from "./create";
import type { ParallaxConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createParallaxPlugin: LazyImagePluginCreator<ParallaxConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ParallaxConfig>;

export type { ParallaxConfig };
