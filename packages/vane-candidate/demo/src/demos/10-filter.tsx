import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "filter",
  title: "阶段 / 标签筛选",
  group: "toolbar",
  plugin: "FilterPlugin",
  intro: "工具栏两个下拉：按阶段、按标签过滤看板；有筛选时出现「清除筛选」。",
  why: "候选人一多，先按阶段或标签缩小范围再逐张看，是每天的第一次点击。",
  plugs: [
    {
      fn: "createFilterPlugin",
      cfg: `{}`,
      why: "筛选状态写 ctx.state，transformData 按状态过滤 —— 只过滤展示，不删数据。",
    },
  ],
  props: [],
  note: "标签选项默认从当前数据收集，也可用 tagOptions 配置固定集合。",
};

export default makeStage("FilterPlugin");
