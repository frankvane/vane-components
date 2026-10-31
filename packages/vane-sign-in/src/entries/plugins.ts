/** ./plugins —— 插件系统 + 官方插件全家桶 */
export { withPlugins as withSignInPlugins } from "../components/SignInPlugin/withPlugins";
export type { SignInPlugin, SignInPluginCreator } from "../components/SignInPlugin/plugins/types";

export { createStreakStatePlugin, type StreakStateConfig } from "../custom-plugins/StreakStatePlugin";
export { createCalendarStripPlugin, type CalendarStripConfig } from "../custom-plugins/CalendarStripPlugin";
export { createRewardPreviewPlugin, type RewardPreviewConfig } from "../custom-plugins/RewardPreviewPlugin";
export { createMakeupSlotPlugin, type MakeupSlotConfig } from "../custom-plugins/MakeupSlotPlugin";
export { createTodayCheckInPlugin, type TodayCheckInConfig } from "../custom-plugins/TodayCheckInPlugin";

export * from "../custom-plugins";
