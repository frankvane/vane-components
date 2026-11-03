import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "recommend-sort",
  title: "智能推荐排序",
  group: "pipeline",
  plugin: "RecommendSortPlugin",
  intro: "transformData 对列表排序：score 模式按匹配分（同分按投递时间新在前），fresh 模式按投递时间。",
  why: "先看分高的、再看新投的 —— 排序插件把「先看谁」这个决定交给数据。",
  plugs: [
    {
      fn: "createRecommendSortPlugin",
      cfg: `{ by: "{{by}}", desc: {{desc}} }`,
      why: "只重排顺序不改数据；归档过滤交给 ArchivePool，本插件不关心。",
    },
  ],
  props: [],
  controls: [
    {
      key: "by",
      label: "排序依据",
      kind: "select",
      init: "score",
      options: [
        { label: "匹配分", value: "score" },
        { label: "投递时间", value: "fresh" },
      ],
    },
    { key: "desc", label: "降序", kind: "switch", init: true },
  ],
  note: "切换「投递时间」后，applied 列首卡从 81 分的郑星野换成 11-02 投递的同分选手。",
};

export default makeStage("RecommendSortPlugin");
