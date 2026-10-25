/**
 * EventLoggerPlugin — 事件日志：记录加载全生命周期事件（可加前缀过滤）。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createEventLoggerPlugin as create } from "./create";
import type { EventLoggerConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createEventLoggerPlugin: LazyImagePluginCreator<EventLoggerConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<EventLoggerConfig>;

export type { EventLoggerConfig };
