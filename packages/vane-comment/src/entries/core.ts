/** ./core —— 只要核心组件时导入这里，体积最小（不含插件系统与任何插件） */
export { default as CommentCore } from "../components/CommentPlugin/CommentCore";
export type {
  CommentCoreProps,
  CommentCoreRef,
} from "../components/CommentPlugin/plugins/types";
