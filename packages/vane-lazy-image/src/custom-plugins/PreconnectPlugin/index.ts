/**
 * PreconnectPlugin — DNS 预连接：提前与图片域名建立连接，可配置跨域。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createPreconnectPlugin as create } from "./create";
import type { PreconnectPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createPreconnectPlugin: LazyImagePluginCreator<PreconnectPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<PreconnectPluginConfig>;

export type { PreconnectPluginConfig };
