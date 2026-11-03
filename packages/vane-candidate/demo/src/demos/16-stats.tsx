import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "stats",
  title: "漏斗统计",
  group: "pipeline",
  plugin: "StatsPlugin",
  intro: "页脚各阶段人数占比条形图 + 列头计数徽章，转化漏斗一眼可读。",
  why: "每周复盘「卡在哪个阶段」：漏斗形态比数字表直觉得多。",
  plugs: [
    {
      fn: "createStatsPlugin",
      cfg: `{ columnCount: {{columnCount}} }`,
      why: "renderFooter 画漏斗（纯只读）；renderColumnHeader 在每列头部挂人数徽章。",
    },
  ],
  props: [],
  controls: [{ key: "columnCount", label: "列头计数", kind: "switch", init: true }],
  note: "统计基于 ctx.data（管道末态）—— 配合筛选插件时，漏斗反映的是筛选后的世界。",
};

export default makeStage("StatsPlugin");
