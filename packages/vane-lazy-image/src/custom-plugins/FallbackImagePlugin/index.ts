/**
 * FallbackImagePlugin — 回退图片：加载失败时切换到备用图片地址。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createFallbackImagePlugin as create } from "./create";
import type { FallbackImageConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createFallbackImagePlugin: LazyImagePluginCreator<FallbackImageConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<FallbackImageConfig>;

export type { FallbackImageConfig };
