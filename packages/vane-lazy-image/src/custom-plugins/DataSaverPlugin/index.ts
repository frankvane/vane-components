/**
 * DataSaverPlugin — 省流模式：saveData 开启时降低质量参数并禁用预加载。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createDataSaverPlugin as create } from "./create";
import type { DataSaverPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createDataSaverPlugin: LazyImagePluginCreator<DataSaverPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<DataSaverPluginConfig>;

export type { DataSaverPluginConfig };
