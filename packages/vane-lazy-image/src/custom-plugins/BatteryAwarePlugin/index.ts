/**
 * BatteryAwarePlugin — 低电量降级：电量低于阈值时缩小请求宽度并禁用预连接。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createBatteryAwarePlugin as create } from "./create";
import type { BatteryAwareConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createBatteryAwarePlugin: LazyImagePluginCreator<BatteryAwareConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<BatteryAwareConfig>;

export type { BatteryAwareConfig };
