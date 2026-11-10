/**
 * 示例 02 · 按类型筛选
 *
 * 图片 / 视频 / 全部，单选段控。切换时页码自动回到 1 —— 否则在第 4 页切类型会看到空白。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "kind-filter",
  title: "按类型筛选",
  group: "plugin",
  plugin: "KindFilterPlugin",
  intro:
    "工具栏里的「全部 / 图片 / 视频」段控，一次只生效一种类型；切换时页码回到第 1 页。",
  why: "素材库至少有两种介质。用段控而不是复选，是因为「同时看图又看视频」几乎没有真实需求，却会让状态多一层。",
  plugs: [
    {
      fn: "createKindFilterPlugin",
      cfg: 'allLabel: "全部"',
      why: "绑定 ctx.kinds 与 ctx.toggleKind；数量角标取自归一化后的素材统计。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 520,
};

export default makeStage("KindFilterPlugin");
