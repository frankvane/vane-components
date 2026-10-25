/**
 * CDNFallbackPlugin — CDN 回退：主域名加载失败时按序切换备用 CDN 域名。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createCDNFallbackPlugin as create } from "./create";
import type { CDNFallbackConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createCDNFallbackPlugin: LazyImagePluginCreator<CDNFallbackConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<CDNFallbackConfig>;

export type { CDNFallbackConfig };
