import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "stat-summary",
  title: "数据概览",
  group: "plugin",
  plugin: "StatSummaryPlugin",
  intro: "在基本信息区追加工作段数 / 技能数 / 项目数 / 最高学历等统计徽章。",
  why: "面试官扫一眼就能抓住「几年经验、几个项目」，量化亮点前置。",
  plugs: [{ fn: "createStatSummaryPlugin", cfg: "{}", why: "装饰累积槽 renderBasics，追加统计徽章。", }],
  props: [],
};

export default makeStage("StatSummaryPlugin");
