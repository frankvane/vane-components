/**
 * ThrottlePlugin — 调整滚动节流与尺寸防抖，弱网/低端机可放宽。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createThrottlePlugin as create } from "./create";
import type { ThrottleConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createThrottlePlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { ThrottleConfig };
