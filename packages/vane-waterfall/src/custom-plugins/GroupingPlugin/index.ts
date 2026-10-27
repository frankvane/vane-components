/**
 * GroupingPlugin — 按字段把项分组，结果写进 sharedData(GROUPS) 供吸顶条 / 统计用。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createGroupingPlugin as create } from "./create";
import type { GroupingConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createGroupingPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { GroupingConfig };
