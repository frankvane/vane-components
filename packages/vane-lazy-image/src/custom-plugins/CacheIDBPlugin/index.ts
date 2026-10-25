/**
 * CacheIDBPlugin — IndexedDB 持久缓存：跨会话缓存图片 Blob/dataURL，支持 TTL。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createIDBCachePlugin as create } from "./create";
import type { IDBCacheConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createIDBCachePlugin: LazyImagePluginCreator<IDBCacheConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<IDBCacheConfig>;

export type { IDBCacheConfig };
export { IDBCache } from "./create";
