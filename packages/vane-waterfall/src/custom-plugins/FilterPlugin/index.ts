/**
 * FilterPlugin — 按谓词过滤 items，参数变化可自动回顶。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createFilterPlugin as create } from "./create";
import type { FilterConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createFilterPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { FilterConfig };
