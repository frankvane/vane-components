/**
 * vane-activity 主入口
 *
 * 刻意**不**桶导出官方插件（ADR-6 严格）：它们各自有子路径
 * （`vane-activity/custom-plugins/<Name>`，并配通配符 `./custom-plugins/*`），谁要谁引。
 * 根入口只聚合「核心 + 装配器 + 领域槽 + 类型」，保持最小体积。
 */

// ===== Core + 插件系统 =====
export { default as ActivityCore } from "./components/ActivityPlugin/ActivityCore";
export { withPlugins } from "./components/ActivityPlugin/withPlugins";
export { resolveExclusivePlugins } from "./components/ActivityPlugin/exclusive";
export type {
  ExclusiveDrop,
  ExclusiveResolution,
} from "./components/ActivityPlugin/exclusive";
export type { WithPluginsConfig } from "vane-plugin-core";
export {
  ActivitySlotProvider,
  renderActivitySlot,
  useActivitySlot,
  useActivityContext,
} from "./components/ActivityPlugin/plugins/slots";

// ===== 领域类型 =====
export type {
  ActivityCoreProps,
  ActivityCoreRef,
  ActivityData,
  ActivityTask,
  ActivityReward,
  ActivityRewardWithStatus,
  ActivityRewardStatus,
  ActivityRule,
  TaskStatus,
  ActivityPlugin,
  ActivityPluginContext,
  ActivityPluginHooks,
  ActivityPluginCreator,
  ActivitySlotName,
} from "./components/ActivityPlugin/plugins/types";

// ===== 复用内核类型（避免消费方重复依赖 vane-plugin-core 取类型）=====
export type {
  Plugin,
  PluginHooks,
  PluginContext,
  PluginCreator,
  PluginDoc,
} from "vane-plugin-core";
