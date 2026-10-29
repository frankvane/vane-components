import { createPinPlugin as create } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createPinPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };
