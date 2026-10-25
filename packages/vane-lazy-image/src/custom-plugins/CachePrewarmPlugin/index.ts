/**
 * CachePrewarmPlugin — 缓存预热：进入视口或挂载时把图片预热到内存/IDB 缓存。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createCachePrewarmPlugin as create } from "./create";
import type { CachePrewarmConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createCachePrewarmPlugin: LazyImagePluginCreator<CachePrewarmConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<CachePrewarmConfig>;

export type { CachePrewarmConfig };
