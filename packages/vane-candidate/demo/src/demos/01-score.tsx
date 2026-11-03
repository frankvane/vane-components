import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "score",
  title: "匹配分徽章",
  group: "badge",
  plugin: "ScorePlugin",
  intro: "候选人卡片右上角的 0-100 匹配分胶囊，按阈值着色（优秀绿 / 待定橙 / 偏低红）。",
  why: "刷简历时第一眼先看匹配度，分数颜色把「优先看谁」编码进视觉层。",
  plugs: [
    {
      fn: "createScorePlugin",
      cfg: `{ goodThreshold: {{goodThreshold}}, warnThreshold: 60 }`,
      why: "纯展示不改数据：只读 candidate.score，按阈值着色。",
    },
  ],
  props: [],
  controls: [
    { key: "goodThreshold", label: "优秀阈值", kind: "number", init: 80, min: 50, max: 95, step: 5 },
  ],
  note: "score 缺省的候选人不渲染徽章；阈值只影响颜色分界，不改排序。",
};

export default makeStage("ScorePlugin");
