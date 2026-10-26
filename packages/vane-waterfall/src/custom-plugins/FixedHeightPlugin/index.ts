/**
 * FixedHeightPlugin — 把项高度统一成固定值，瀑布流退化为等高网格。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createFixedHeightPlugin as create } from "./create";
import type { FixedHeightConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createFixedHeightPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { FixedHeightConfig };
