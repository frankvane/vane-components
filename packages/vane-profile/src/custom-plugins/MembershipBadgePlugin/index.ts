import { createMembershipBadgePlugin as create } from "./create";
import type { MembershipBadgeConfig } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createMembershipBadgePlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { MembershipBadgeConfig };
