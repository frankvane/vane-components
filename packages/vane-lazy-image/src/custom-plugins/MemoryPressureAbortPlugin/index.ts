/**
 * MemoryPressureAbortPlugin — 内存压力降级：设备内存不足或移动端时改请求低清图。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createMemoryPressureAbortPlugin as create } from "./create";
import type { MemoryPressureAbortConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createMemoryPressureAbortPlugin: LazyImagePluginCreator<MemoryPressureAbortConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<MemoryPressureAbortConfig>;

export type { MemoryPressureAbortConfig };
