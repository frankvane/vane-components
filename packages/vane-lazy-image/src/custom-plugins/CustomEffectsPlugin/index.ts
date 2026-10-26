/**
 * CustomEffectsPlugin — 自定义效果「逃逸舱」：注入任意 CSS 效果（filter / transform /
 * transition / className），内置视觉插件覆盖不到的诉求用它即可，无需新造组件。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createCustomEffectsPlugin as create } from "./create";
import type { CustomEffectsConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createCustomEffectsPlugin: LazyImagePluginCreator<CustomEffectsConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<CustomEffectsConfig>;

export type { CustomEffectsConfig };
