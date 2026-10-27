/**
 * BookmarkPlugin — 按 B 记录滚动位置、按 R 跳回（localStorage），忽略输入框按键。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createBookmarkPlugin as create } from "./create";
import type { BookmarkConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createBookmarkPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { BookmarkConfig };
