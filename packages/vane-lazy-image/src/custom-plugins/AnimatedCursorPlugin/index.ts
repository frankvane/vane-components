import { createAnimatedCursorPlugin as create } from "./create";
import type { AnimatedCursorConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

export const createAnimatedCursorPlugin: LazyImagePluginCreator<AnimatedCursorConfig> =
  Object.assign(create, { meta: doc }) as LazyImagePluginCreator<AnimatedCursorConfig>;

export type { AnimatedCursorConfig };
