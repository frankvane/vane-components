/**
 * ViewportDebouncePlugin — 视口防抖：对进出视口事件去抖，防止快速滚动反复触发。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createViewportDebouncePlugin as create } from "./create";
import type { ViewportDebounceConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createViewportDebouncePlugin: LazyImagePluginCreator<ViewportDebounceConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ViewportDebounceConfig>;

export type { ViewportDebounceConfig };
