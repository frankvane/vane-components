/**
 * PinItemPlugin — 把指定索引的项钉在顶部同一列，不参与常规列高推进（广告位 / 公告卡）。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createPinItemPlugin as create } from "./create";
import type { PinItemConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + `.meta`：`typeof create` 保留原工厂的泛型签名，
 * `.meta` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const createPinItemPlugin = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};

export type { PinItemConfig };
