import { createContactCardPlugin as create } from "./create";
import type { ContactCardConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createContactCardPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { ContactCardConfig };
