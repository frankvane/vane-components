import { createBioSlotPlugin as create } from "./create";
import type { BioSlotConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createBioSlotPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { BioSlotConfig };
