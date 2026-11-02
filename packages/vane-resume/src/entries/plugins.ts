/** ./plugins —— 插件系统 + 官方插件全家桶 */
// 与根入口一致：withPlugins 指向领域 HOC（会挂 ResumeSlotProvider）。
// 内核通用版请直接从 vane-plugin-core 导入。
export {
  withResumePlugins,
  withResumePlugins as withPlugins,
} from "../components/ResumePlugin/withPlugins";
export type { Plugin, PluginHooks, PluginContext, PluginCreator } from "vane-plugin-core";

export * from "../custom-plugins";
