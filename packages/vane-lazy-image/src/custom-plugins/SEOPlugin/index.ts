/**
 * SEOPlugin — SEO 增强：alt/title 回退、固定 aspectRatio 减少 CLS、preload 与 LCP 优先。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createSEOPlugin as create } from "./create";
import type { SEOPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createSEOPlugin: LazyImagePluginCreator<SEOPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<SEOPluginConfig>;

export type { SEOPluginConfig };
