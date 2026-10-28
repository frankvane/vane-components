import { createStatRowPlugin as create } from "./create";
import type { StatRowConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createStatRowPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { StatRowConfig };
