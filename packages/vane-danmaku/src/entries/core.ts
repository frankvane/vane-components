/** ./core —— 只要核心组件 + 装配时导入这里，体积最小（不含任何插件） */
export { DanmakuCore } from "../components/DanmakuPlugin/DanmakuCore";
export { withDanmakuPlugins } from "../components/DanmakuPlugin/withPlugins";
export { DanmakuScheduler, draw, measure } from "../components/DanmakuPlugin/render";
export type { RenderOptions, Active } from "../components/DanmakuPlugin/render";
export type {
  DanmakuCoreProps,
  DanmakuCoreRef,
  DanmakuData,
  DanmakuItem,
  DanmakuMeta,
  DanmakuMode,
  Rect,
} from "../components/DanmakuPlugin/plugins/types";
