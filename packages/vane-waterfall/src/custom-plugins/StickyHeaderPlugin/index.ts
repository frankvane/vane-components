/**
 * StickyHeaderPlugin — 滚动容器内的吸顶标题条，可与分组联动显示当前组。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createStickyHeaderPlugin as create } from "./create";
import type { StickyHeaderConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createStickyHeaderPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { StickyHeaderConfig };
