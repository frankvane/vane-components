import { createQRSharePlugin as create } from "./create";
import type { QRShareConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createQRSharePlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { QRShareConfig };
