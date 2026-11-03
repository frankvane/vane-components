import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "star",
  title: "星标收藏",
  group: "action",
  plugin: "StarPlugin",
  intro: "卡片操作区 ☆/★ 一键切换，pinTop 开启时星标候选人置顶到各自阶段列最前。",
  why: "挑出「今晚要再聊一轮」的人：星标是最轻量的关注动作。",
  plugs: [
    {
      fn: "createStarPlugin",
      cfg: `{ pinTop: {{pinTop}} }`,
      why: "置顶经 transformData 实现，只影响展示顺序，不动数据。",
    },
  ],
  props: [],
  controls: [{ key: "pinTop", label: "星标置顶", kind: "switch", init: true }],
  note: "关掉置顶后星标只改颜色不重排 —— 适合「保留顺序感」的团队习惯。",
};

export default makeStage("StarPlugin");
