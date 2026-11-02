import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "ai-polish",
  title: "AI 润色",
  group: "plugin",
  plugin: "AiPolishPlugin",
  intro: "调用可插拔服务润色摘要 / 工作描述 / 项目描述，可一键还原（不硬编码密钥）。",
  why: "自己写的描述常偏口语，接一个润色服务提一档专业度。",
  plugs: [
    {
      fn: "createAiPolishPlugin",
      cfg: `fields: ["summary", "work", "projects"]`,
      why: "transformData 改写对应字段，renderToolbar 提供「润色 / 还原」按钮；polish 由宿主注入。",
    },
  ],
  props: [],
  note: "演示态的 polish 为占位实现，真实项目把服务注入 createAiPolishPlugin({ polish }) 即可。",
};

export default makeStage("AiPolishPlugin");
