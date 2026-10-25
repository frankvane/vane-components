/**
 * RedactionPlugin — 隐私打码：在指定百分比区域叠加模糊或色块遮挡。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createRedactionPlugin as create } from "./create";
import type { RedactionConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createRedactionPlugin: LazyImagePluginCreator<RedactionConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<RedactionConfig>;

export type { RedactionConfig };
