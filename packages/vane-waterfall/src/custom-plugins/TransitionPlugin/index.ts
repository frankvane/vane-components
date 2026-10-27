/**
 * TransitionPlugin — 布局变化时给项加 transform/opacity 过渡，插入新数据不「闪现」。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createTransitionPlugin as create } from "./create";
import type { TransitionConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createTransitionPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { TransitionConfig };
