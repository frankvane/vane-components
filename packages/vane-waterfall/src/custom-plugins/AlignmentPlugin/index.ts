/**
 * AlignmentPlugin — 指定列分配策略：最矮列优先（shortest）/ 项数均衡（balanced）/ 顺序轮转（sequential）。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createAlignmentPlugin as create } from "./create";
import type { AlignmentConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createAlignmentPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { AlignmentConfig };
