import { createAchievementWallPlugin as create } from "./create";
import type { AchievementWallConfig, AchievementItem } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "vane-plugin-core";

export const createAchievementWallPlugin = Object.assign(create, {
  meta: doc as PluginDoc,
}) as typeof create & { meta: PluginDoc };

export type { AchievementWallConfig, AchievementItem };
