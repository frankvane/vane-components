/**
 * ResponsiveColumnsPlugin — 按断点表决定列数（如 640 → 2 列、1024 → 3 列、1440 → 4 列）。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createResponsiveColumnsPlugin as create } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createResponsiveColumnsPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

