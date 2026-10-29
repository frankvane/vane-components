import { createThreadPlugin as create } from "./create";
import type { ThreadPluginConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createThreadPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { ThreadPluginConfig };
