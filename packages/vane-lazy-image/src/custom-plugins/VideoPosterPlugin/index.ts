/**
 * VideoPosterPlugin — 视频海报：将图片作为视频封面，点击播放视频（模态框或内联）。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createVideoPosterPlugin as create } from "./create";
import type { VideoPosterPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createVideoPosterPlugin: LazyImagePluginCreator<VideoPosterPluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<VideoPosterPluginConfig>;

export type { VideoPosterPluginConfig };
