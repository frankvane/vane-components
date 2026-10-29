import { createSocialLinksPlugin as create } from "./create";
import type { SocialLinksConfig, SocialLink } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createSocialLinksPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { SocialLinksConfig, SocialLink };
