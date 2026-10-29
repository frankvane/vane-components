/**
 * vane-comment 包根入口
 *
 * 刻意**不**桶导出官方插件（ADR-6 严格）：它们各自有子路径
 * （`vane-comment/custom-plugins/<Name>`，并配通配符 `./custom-plugins/*`），谁要谁引。
 * 根入口只聚合「核心 + 装配器 + 领域槽/上下文 + 类型」，保持最小体积（≤4KB gzip）。
 */

// ===== Core + 插件系统 =====
export { default as CommentCore } from "./components/CommentPlugin/CommentCore";
export { withCommentPlugins } from "./components/CommentPlugin/withCommentPlugins";
export {
  CommentSlotProvider,
  renderCommentSlot,
  useCommentSlot,
  useCommentContext,
} from "./components/CommentPlugin/plugins/slots";

// ===== 领域类型 =====
export type {
  CommentCoreProps,
  CommentCoreRef,
  CommentPlugin,
  CommentPluginContext,
  CommentPluginHooks,
  CommentPluginCreator,
  CommentSlotName,
  CommentNode,
  CommentAuthor,
  CommentImage,
  Comment,
  SortMode,
  CommentStatus,
  CommentData,
} from "./components/CommentPlugin/plugins/types";

// ===== 复用内核类型（避免消费方重复依赖 vane-plugin-core 取类型）=====
export type {
  Plugin,
  PluginHooks,
  PluginContext,
  PluginCreator,
  PluginBus,
  PluginDoc,
} from "vane-plugin-core";
