/**
 * vane-sign-in 主入口。
 * 只导出「核心 + 装配 + 契约类型 + 插件工厂」，保持默认导入体积最小。
 * 插件走子路径 ./custom-plugins/<Name>Plugin（ADR-6：根不桶导出插件）。
 */
export { SignInCore } from "./components/SignInPlugin/SignInCore";
export { withPlugins as withSignInPlugins } from "./components/SignInPlugin/withPlugins";
export type {
  SignInCoreProps,
  SignInCoreRef,
  SignInData,
  DayCell,
  DayStatus,
  RewardInfo,
  MakeupInfo,
  LevelInfo,
  ClaimRecord,
  SignInCallbacks,
  SignInPluginContext,
  SignInPluginHooks,
  SignInPlugin,
  SignInPluginCreator,
  SignInSlotName,
} from "./components/SignInPlugin/plugins/types";

// 插件工厂（用户必做四件套 + 主 CTA）
export { createStreakStatePlugin, type StreakStateConfig } from "./custom-plugins/StreakStatePlugin";
export { createCalendarStripPlugin, type CalendarStripConfig } from "./custom-plugins/CalendarStripPlugin";
export { createRewardPreviewPlugin, type RewardPreviewConfig } from "./custom-plugins/RewardPreviewPlugin";
export { createMakeupSlotPlugin, type MakeupSlotConfig } from "./custom-plugins/MakeupSlotPlugin";
export { createTodayCheckInPlugin, type TodayCheckInConfig } from "./custom-plugins/TodayCheckInPlugin";
