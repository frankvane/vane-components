/**
 * DecodeAfterIdlePlugin — 空闲解码：加载成功后延迟到浏览器空闲再执行 img.decode()。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createDecodeAfterIdlePlugin as create } from "./create";
import type { DecodeAfterIdleConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createDecodeAfterIdlePlugin: LazyImagePluginCreator<DecodeAfterIdleConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<DecodeAfterIdleConfig>;

export type { DecodeAfterIdleConfig };
