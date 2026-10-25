/**
 * HoverZoomPlugin — 悬停放大：鼠标悬停时放大显示图片局部。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createHoverZoomPlugin as create } from "./create";
import type { HoverZoomPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createHoverZoomPlugin: LazyImagePluginCreator<HoverZoomPluginConfig> = Object.assign(create, {
  meta: doc,
});

export type { HoverZoomPluginConfig };
