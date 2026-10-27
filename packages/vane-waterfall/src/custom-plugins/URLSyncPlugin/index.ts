/**
 * URLSyncPlugin — 把分页/搜索/排序同步进 URL（hash 或 search），链接可分享。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createURLSyncPlugin as create } from "./create";
import type { URLSyncConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createURLSyncPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { URLSyncConfig };
