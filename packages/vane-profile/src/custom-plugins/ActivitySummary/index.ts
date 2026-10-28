import { createActivitySummaryPlugin as create } from "./create";
import type { ActivitySummaryConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createActivitySummaryPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { ActivitySummaryConfig };
