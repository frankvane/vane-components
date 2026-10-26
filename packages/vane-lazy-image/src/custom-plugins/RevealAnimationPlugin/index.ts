import { createRevealAnimationPlugin as create } from "./create";
import type { RevealAnimationConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

export const createRevealAnimationPlugin: LazyImagePluginCreator<RevealAnimationConfig> =
  Object.assign(create, { meta: doc }) as LazyImagePluginCreator<RevealAnimationConfig>;

export type { RevealAnimationConfig };
