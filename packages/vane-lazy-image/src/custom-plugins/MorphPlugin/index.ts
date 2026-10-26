import { createMorphPlugin as create } from "./create";
import type { MorphConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

export const createMorphPlugin: LazyImagePluginCreator<MorphConfig> = Object.assign(
  create,
  { meta: doc }
) as LazyImagePluginCreator<MorphConfig>;

export type { MorphConfig };
