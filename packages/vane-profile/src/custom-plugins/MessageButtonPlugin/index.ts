import { createMessageButtonPlugin as create } from "./create";
import type { MessageButtonConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createMessageButtonPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { MessageButtonConfig };
