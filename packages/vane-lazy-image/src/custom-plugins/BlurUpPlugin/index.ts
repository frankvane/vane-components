/**
 * BlurUpPlugin — 模糊放大占位：加载期为图片注入 blur 滤镜，加载成功后过渡到清晰，避免「白屏 → 清晰图」的突兀切换。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createBlurUpPlugin as create } from "./create";
import type { BlurUpConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createBlurUpPlugin: LazyImagePluginCreator<BlurUpConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<BlurUpConfig>;

export type { BlurUpConfig };
