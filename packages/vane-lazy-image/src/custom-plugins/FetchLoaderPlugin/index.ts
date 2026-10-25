/**
 * FetchLoaderPlugin — fetch 流式加载器。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createFetchLoaderPlugin as create } from "./create";
import type { FetchLoaderPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createFetchLoaderPlugin: LazyImagePluginCreator<FetchLoaderPluginConfig> =
  Object.assign(create, { meta: doc });

export type { FetchLoaderPluginConfig };
export { create as createFetchLoaderPluginRaw };
