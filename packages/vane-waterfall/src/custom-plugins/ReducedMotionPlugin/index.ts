/**
 * ReducedMotionPlugin — 尊重系统「减少动画」偏好：关掉 transform 定位与项过渡。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createReducedMotionPlugin as create } from "./create";
import type { ReducedMotionConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createReducedMotionPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { ReducedMotionConfig };
