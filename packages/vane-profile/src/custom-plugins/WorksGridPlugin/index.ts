import { createWorksGridPlugin as create } from "./create";
import type { WorksGridConfig, WorkItem } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createWorksGridPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { WorksGridConfig, WorkItem };
