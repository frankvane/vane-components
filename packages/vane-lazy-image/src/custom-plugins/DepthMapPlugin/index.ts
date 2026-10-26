import { createDepthMapPlugin as create } from "./create";
import type { DepthMapConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

export const createDepthMapPlugin: LazyImagePluginCreator<DepthMapConfig> = Object.assign(
  create,
  { meta: doc }
) as LazyImagePluginCreator<DepthMapConfig>;

export type { DepthMapConfig };
