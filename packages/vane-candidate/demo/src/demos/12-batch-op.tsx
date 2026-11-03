import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "batch-op",
  title: "批量操作",
  group: "toolbar",
  plugin: "BatchOpPlugin",
  intro: "工具栏「批量」开关进入选择模式：卡片出现复选框，支持全选 / 清空 / 批量流转 / 批量归档。",
  why: "一个批次 30 份简历都过了初筛，逐张点推进会把人点废。",
  plugs: [
    {
      fn: "createBatchOpPlugin",
      cfg: `{}`,
      why: "选择集放 ctx.state.batchSelected；批量流转按阶段序号差值调 ctx.moveCandidate。",
    },
  ],
  props: [],
  note: "批量归档只写 archived 标记 —— 看板上消失需要配合 ArchivePool 插件（见场景页）。",
};

export default makeStage("BatchOpPlugin");
