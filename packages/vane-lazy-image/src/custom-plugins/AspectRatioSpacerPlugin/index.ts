/**
 * AspectRatioSpacerPlugin — 宽高比占位：按 ratio 预留空间，避免加载造成的布局抖动（CLS）。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createAspectRatioSpacerPlugin as create } from "./create";
import type { AspectRatioSpacerConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createAspectRatioSpacerPlugin: LazyImagePluginCreator<AspectRatioSpacerConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<AspectRatioSpacerConfig>;

export type { AspectRatioSpacerConfig };
