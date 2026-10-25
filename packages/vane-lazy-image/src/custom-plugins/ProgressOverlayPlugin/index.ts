/**
 * ProgressOverlayPlugin — 加载进度条覆盖层：百分比文本与 indeterminate 模式。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createProgressOverlayPlugin as create } from "./create";
import type { ProgressOverlayConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createProgressOverlayPlugin: LazyImagePluginCreator<ProgressOverlayConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ProgressOverlayConfig>;

export type { ProgressOverlayConfig };
