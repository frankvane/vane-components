/**
 * vane-profile 包根入口
 *
 * 刻意**不**桶导出官方插件（ADR-6 严格）：它们各自有子路径
 * （`vane-profile/custom-plugins/<Name>`，并配通配符 `./custom-plugins/*`），谁要谁引。
 * 根入口只聚合「核心 + 装配器 + 领域槽/上下文 + 类型」，保持最小体积（≤3.5KB gzip）。
 */

// ===== Core + 插件系统 =====
export { default as ProfileCore } from "./components/ProfilePlugin/ProfileCore";
export { withPlugins } from "./components/ProfilePlugin/withPlugins";
export {
  ProfileSlotProvider,
  renderProfileSlot,
  useProfileSlot,
  useProfileContext,
} from "./components/ProfilePlugin/plugins/slots";

// ===== 领域类型 =====
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
} from "./components/ProfilePlugin/plugins/types";

// ===== 复用内核类型（避免消费方重复依赖 vane-plugin-core 取类型）=====
export type {
  Plugin,
  PluginHooks,
  PluginContext,
  PluginCreator,
  PluginBus,
  PluginDoc,
} from "vane-plugin-core";
