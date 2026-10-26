/**
 * ScrollAnchorPlugin — 监听 `anchor:scrollToId` 事件，按业务 id 滚动到对应项。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createScrollAnchorPlugin as create } from "./create";
import type { ScrollAnchorConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createScrollAnchorPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { ScrollAnchorConfig };
