/**
 * DebounceLayoutPlugin — 单独放大布局防抖，容器频繁变宽时（抽屉/侧栏动画）不抖。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createDebounceLayoutPlugin as create } from "./create";
import type { DebounceConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createDebounceLayoutPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { DebounceConfig };
