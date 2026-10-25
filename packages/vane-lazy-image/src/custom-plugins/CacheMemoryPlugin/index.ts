/**
 * CacheMemoryPlugin — 内存 LRU 缓存：会话内缓存图片数据，可配置容量与过期时间。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createMemoryCachePlugin as create } from "./create";
import type { MemoryCacheConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createMemoryCachePlugin: LazyImagePluginCreator<MemoryCacheConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<MemoryCacheConfig>;

export type { MemoryCacheConfig };
export { MemoryCache } from "./create";
