/**
 * ClickAnalyticsPlugin — 统计项点击次数，发 `analytics:click` 事件，可选角标与日志。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createClickAnalyticsPlugin as create } from "./create";
import type { ClickAnalyticsConfig, ClickAnalyticsStats } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createClickAnalyticsPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { ClickAnalyticsConfig, ClickAnalyticsStats };
