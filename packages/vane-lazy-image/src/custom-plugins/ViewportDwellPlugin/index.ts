/**
 * ViewportDwellPlugin — 停留门槛：在视口内停留不足 dwellMs 则跳过加载，避免快速滚动浪费。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createViewportDwellPlugin as create } from "./create";
import type { ViewportDwellConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createViewportDwellPlugin: LazyImagePluginCreator<ViewportDwellConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ViewportDwellConfig>;

export type { ViewportDwellConfig };
