/**
 * AltTextPlugin — alt 自动生成：从 src 推导或按前缀生成 alt 文本。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createAltTextPlugin as create } from "./create";
import type { AltTextPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createAltTextPlugin: LazyImagePluginCreator<AltTextPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<AltTextPluginConfig>;

export type { AltTextPluginConfig };
