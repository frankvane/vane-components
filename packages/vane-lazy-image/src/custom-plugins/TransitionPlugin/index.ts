/**
 * TransitionPlugin — 加载成功过渡动画：从指定透明度/缩放到目标值的平滑过渡。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createTransitionPlugin as create } from "./create";
import type { TransitionPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createTransitionPlugin: LazyImagePluginCreator<TransitionPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<TransitionPluginConfig>;

export type { TransitionPluginConfig };
