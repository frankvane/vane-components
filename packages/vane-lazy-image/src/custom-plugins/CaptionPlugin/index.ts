/**
 * CaptionPlugin — 图片说明文字覆盖层，支持样式定制。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createCaptionPlugin as create } from "./create";
import type { CaptionPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createCaptionPlugin: LazyImagePluginCreator<CaptionPluginConfig> = Object.assign(create, {
  meta: doc,
});

export type { CaptionPluginConfig };
