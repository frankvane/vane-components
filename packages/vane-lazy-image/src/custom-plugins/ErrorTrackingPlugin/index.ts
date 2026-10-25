/**
 * ErrorTrackingPlugin — 错误追踪：上报加载失败详情（端点或自定义函数），可显示徽标。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createErrorTrackingPlugin as create } from "./create";
import type { ErrorTrackingConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createErrorTrackingPlugin: LazyImagePluginCreator<ErrorTrackingConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ErrorTrackingConfig>;

export type { ErrorTrackingConfig };
