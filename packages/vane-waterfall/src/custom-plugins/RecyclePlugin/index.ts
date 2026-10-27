/**
 * RecyclePlugin — 视口外的项设 `visibility: hidden`，降低长列表的绘制压力。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createRecyclePlugin as create } from "./create";
import type { RecycleConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createRecyclePlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { RecycleConfig };
