/**
 * AdaptiveQualityPlugin — 网络自适应画质：按 effectiveType/saveData 调整质量参数，支持实时监听。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createAdaptiveQualityPlugin as create } from "./create";
import type { AdaptiveQualityConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createAdaptiveQualityPlugin: LazyImagePluginCreator<AdaptiveQualityConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<AdaptiveQualityConfig>;

export type { AdaptiveQualityConfig };
