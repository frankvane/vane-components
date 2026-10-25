/**
 * ExifOrientationPlugin — EXIF 方向校正：按拍摄方向旋转图片，避免竖拍横显。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createExifOrientationPlugin as create } from "./create";
import type { ExifOrientationConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createExifOrientationPlugin: LazyImagePluginCreator<ExifOrientationConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ExifOrientationConfig>;

export type { ExifOrientationConfig };
