/**
 * WebPPlugin — WebP 优先：支持 WebP 的环境优先加载 .webp，失败自动回退原图。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createWebPPlugin as create } from "./create";
import type { WebPPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createWebPPlugin: LazyImagePluginCreator<WebPPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<WebPPluginConfig>;

export type { WebPPluginConfig };
