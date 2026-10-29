import { createFavoritePlugin as create } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createFavoritePlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };
