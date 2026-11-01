/** ./core —— 只要核心组件 + 装配时导入这里，体积最小（不含任何插件） */
export { SignInCore } from "../components/SignInPlugin/SignInCore";
export { withPlugins as withSignInPlugins } from "../components/SignInPlugin/withPlugins";
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
  SignInCallbackResult,
  SignInError,
  SignInPluginContext,
  SignInPluginHooks,
  SignInPlugin,
  SignInPluginCreator,
  SignInSlotName,
} from "../components/SignInPlugin/plugins/types";

// 日期 / 数据归一工具（跨天、时区、脏数据兜底的统一入口）
export {
  toDayKey,
  formatDayKey,
  todayKey,
  addDays,
  diffDays,
  compareDayKeys,
  isDayKey,
} from "../utils/date";
export type { DayKey } from "../utils/date";
export { normalizeSignInData } from "../utils/normalize";
