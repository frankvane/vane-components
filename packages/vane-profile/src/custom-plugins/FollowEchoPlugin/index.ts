import { createFollowEchoPlugin as create } from "./create";
import type { FollowEchoConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createFollowEchoPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { FollowEchoConfig };
