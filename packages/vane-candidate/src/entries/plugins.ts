/** ./plugins —— 插件系统 + 官方插件全家桶 */
// 与根入口一致：withPlugins 指向领域 HOC（会挂 CandidateSlotProvider）。
// 内核通用版请直接从 vane-plugin-core 导入。
export {
  withCandidatePlugins,
  withCandidatePlugins as withPlugins,
} from "../components/CandidatePlugin/withPlugins";
export type { Plugin, PluginHooks, PluginContext, PluginCreator } from "vane-plugin-core";

export * from "../custom-plugins";
