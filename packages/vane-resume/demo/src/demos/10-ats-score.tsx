import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "ats-score",
  title: "ATS 评分",
  group: "plugin",
  plugin: "AtsScorePlugin",
  intro: "扫描常见雷区（缺姓名 / 联系方式 / 量化亮点 / 命中 JD 关键词等），输出 0-100 评分与改进建议。",
  why: "很多公司先用 ATS 机筛，投递前自检一遍能少踩坑。",
  plugs: [
    {
      fn: "createAtsScorePlugin",
      cfg: `{ jobKeywords: ["React", "TypeScript", "Node"] }`,
      why: "纯分析不改数据，把报告写入 ctx.shared，浮层逐条列出建议。",
    },
  ],
  props: [],
  note: "ATS 评分依赖数据管道末态，故排在脱敏 / 多语言之后执行。",
};

export default makeStage("AtsScorePlugin");
