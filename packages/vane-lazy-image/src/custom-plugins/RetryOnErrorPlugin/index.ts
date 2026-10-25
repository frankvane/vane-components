/**
 * RetryOnErrorPlugin — 失败重试：指数退避 + 可选抖动的自动重试。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createRetryOnErrorPlugin as create } from "./create";
import type { RetryOnErrorConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createRetryOnErrorPlugin: LazyImagePluginCreator<RetryOnErrorConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<RetryOnErrorConfig>;

export type { RetryOnErrorConfig };
