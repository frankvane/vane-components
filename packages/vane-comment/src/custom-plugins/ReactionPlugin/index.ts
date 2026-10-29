import { createReactionPlugin as create } from "./create";
import type { ReactionPluginConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createReactionPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { ReactionPluginConfig };
