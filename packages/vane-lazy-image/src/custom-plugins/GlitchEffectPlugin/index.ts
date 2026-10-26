import { createGlitchEffectPlugin as create } from "./create";
import type { GlitchEffectConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

export const createGlitchEffectPlugin: LazyImagePluginCreator<GlitchEffectConfig> =
  Object.assign(create, { meta: doc }) as LazyImagePluginCreator<GlitchEffectConfig>;

export type { GlitchEffectConfig };
