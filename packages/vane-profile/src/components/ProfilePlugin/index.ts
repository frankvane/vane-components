/**
 * ProfilePlugin 系统入口（组件包内部聚合，外部经包根导出）
 */

// 核心组件
export { default as ProfileCore } from "./ProfileCore";

// 插件系统（装配器 / 领域槽位 / 上下文 hook / 类型）
export { withPlugins } from "./withPlugins";
export type { WithPluginsConfig } from "./withPlugins";
export {
  ProfileSlotProvider,
  renderProfileSlot,
  useProfileSlot,
  useProfileContext,
} from "./plugins/slots";

// 领域类型
export type {
  ProfileCoreProps,
  ProfileCoreRef,
  ProfilePlugin,
  ProfilePluginContext,
  ProfilePluginHooks,
  ProfilePluginCreator,
  ProfileSlotName,
  StatItem,
  FollowState,
  BadgeType,
} from "./plugins/types";
