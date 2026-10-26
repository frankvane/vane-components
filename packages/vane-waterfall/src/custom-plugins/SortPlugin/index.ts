/**
 * SortPlugin — 按比较函数排序 items，比较函数变化可自动回顶。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createSortPlugin as create } from "./create";
import type { SortConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createSortPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { SortConfig };
