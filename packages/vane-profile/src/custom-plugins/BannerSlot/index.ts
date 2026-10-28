import { createBannerSlotPlugin as create } from "./create";
import type { BannerSlotConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createBannerSlotPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { BannerSlotConfig };
