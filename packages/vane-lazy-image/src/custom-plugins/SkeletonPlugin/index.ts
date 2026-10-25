/**
 * SkeletonPlugin — 骨架屏占位：加载期显示 shimmer/pulse 骨架动画。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createSkeletonPlugin as create } from "./create";
import type { SkeletonPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createSkeletonPlugin: LazyImagePluginCreator<SkeletonPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<SkeletonPluginConfig>;

export type { SkeletonPluginConfig };
