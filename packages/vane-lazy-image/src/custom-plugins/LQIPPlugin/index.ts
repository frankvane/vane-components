/**
 * LQIPPlugin — 低清晰度占位图（LQIP）：加载期叠加模糊小图，支持自定义透明度与层级。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createLqipPlugin as create } from "./create";
import type { LqipPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createLqipPlugin: LazyImagePluginCreator<LqipPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<LqipPluginConfig>;

export type { LqipPluginConfig };
