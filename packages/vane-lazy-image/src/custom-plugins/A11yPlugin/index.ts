/**
 * A11yPlugin — 无障碍支持：装饰性图片、自定义 aria-label、加载状态文本覆盖层。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createA11yPlugin as create } from "./create";
import type { A11yPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createA11yPlugin: LazyImagePluginCreator<A11yPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<A11yPluginConfig>;

export type { A11yPluginConfig };
