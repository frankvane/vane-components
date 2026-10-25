/**
 * ConcurrencyControlPlugin — 并发控制：限制同时加载数量，支持按域名分片与网络自适应。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createConcurrencyControlPlugin as create } from "./create";
import type { ConcurrencyControlConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createConcurrencyControlPlugin: LazyImagePluginCreator<ConcurrencyControlConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ConcurrencyControlConfig>;

export type { ConcurrencyControlConfig };
