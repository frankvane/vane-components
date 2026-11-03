import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "activity-log",
  title: "操作日志",
  group: "pipeline",
  plugin: "ActivityLogPlugin",
  intro: "汇总所有候选人的 history（流转 / 备注等），按时间倒序在浮层展示，页脚提供入口。",
  why: "「这简历上周谁推进的？」—— 审计与交接时，时间线比记忆可靠。",
  plugs: [
    {
      fn: "createActivityLogPlugin",
      cfg: `{ maxEntries: {{maxEntries}} }`,
      why: "只读插件：日志由写操作插件经 updateCandidate / moveCandidate 链路自动记录。",
    },
  ],
  props: [],
  controls: [{ key: "maxEntries", label: "展示条数", kind: "number", init: 20, min: 5, max: 50, step: 5 }],
  note: "样例里 c-001 / c-008 / c-002 自带 history；先去推一张卡再打开日志，能看到新记录。",
};

export default makeStage("ActivityLogPlugin");
