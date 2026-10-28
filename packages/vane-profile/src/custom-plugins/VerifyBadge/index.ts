import { createVerifyBadgePlugin as create } from "./create";
import type { VerifyBadgeConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createVerifyBadgePlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { VerifyBadgeConfig };
