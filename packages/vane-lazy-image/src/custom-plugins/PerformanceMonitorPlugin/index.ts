/**
 * PerformanceMonitorPlugin — 性能监控：统计加载耗时并可选覆盖层实时展示。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createPerformanceMonitorPlugin as create } from "./create";
import type { PerformanceMonitorConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createPerformanceMonitorPlugin: LazyImagePluginCreator<PerformanceMonitorConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<PerformanceMonitorConfig>;

export type { PerformanceMonitorConfig };
