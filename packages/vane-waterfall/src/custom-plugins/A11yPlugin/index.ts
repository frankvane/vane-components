/**
 * A11yPlugin — 给容器与项补 ARIA role / label / posinset，支持键盘 Tab 遍历。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createA11yPlugin as create } from "./create";
import type { A11yConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createA11yPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { A11yConfig };
