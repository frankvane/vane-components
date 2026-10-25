/**
 * PredictiveLoadingPlugin — 预测性预加载：按启发式或自定义模型预加载后续图片。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createPredictiveLoadingPlugin as create } from "./create";
import type { PredictiveLoadingPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createPredictiveLoadingPlugin: LazyImagePluginCreator<PredictiveLoadingPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<PredictiveLoadingPluginConfig>;

export type { PredictiveLoadingPluginConfig };
