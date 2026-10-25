/**
 * OverlayInfoPlugin — 信息覆盖层：显示自定义文本，支持常显或悬停触发。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createOverlayInfoPlugin as create } from "./create";
import type { OverlayInfoConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createOverlayInfoPlugin: LazyImagePluginCreator<OverlayInfoConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<OverlayInfoConfig>;

export type { OverlayInfoConfig };
