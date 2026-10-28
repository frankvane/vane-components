import { createLiveStatusPlugin as create } from "./create";
import type { LiveStatusConfig, LiveStatusKind } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createLiveStatusPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { LiveStatusConfig, LiveStatusKind };
