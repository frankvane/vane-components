import { createTabSyncPlugin as create } from "./create";
import type { TabSyncConfig, TabItem } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createTabSyncPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { TabSyncConfig, TabItem };
