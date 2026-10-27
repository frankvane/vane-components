/**
 * InfiniteScrollPlugin — 滚动到距底部阈值内触发加载更多，带并发锁防重复请求。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createInfiniteScrollPlugin as create } from "./create";
import type { InfiniteScrollConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createInfiniteScrollPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { InfiniteScrollConfig };
