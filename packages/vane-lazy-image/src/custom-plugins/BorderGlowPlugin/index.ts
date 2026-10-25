/**
 * BorderGlowPlugin — 边框光晕：加载成功后为卡片应用发光阴影，悬停时增强。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createBorderGlowPlugin as create } from "./create";
import type { BorderGlowPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createBorderGlowPlugin: LazyImagePluginCreator<BorderGlowPluginConfig> = Object.assign(create, {
  meta: doc,
});

export type { BorderGlowPluginConfig };
