import { createFilterPlugin as create } from "./create";
import type { FilterPluginConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createFilterPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { FilterPluginConfig };
