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
  SignInPluginContext,
  SignInPluginHooks,
  SignInPlugin,
  SignInPluginCreator,
  SignInSlotName,
} from "../components/SignInPlugin/plugins/types";
