/**
 * 示例 03 · 标签筛选
 *
 * 标签按出现次数倒序，只展示前 N 个；选中多个标签是「或」关系（任一命中即保留）。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "tag-filter",
  title: "标签筛选",
  group: "plugin",
  plugin: "TagFilterPlugin",
  intro:
    "工具条里一排标签 chip，按出现次数倒序取前 6 个；点选多个标签取并集，再点一次取消。",
  why: "标签是运营自己维护的维度，比文件夹细、比搜索快。用「或」而不是「与」，是因为多选标签时用户想看的是「这几类我都关心」。",
  plugs: [
    {
      fn: "createTagFilterPlugin",
      cfg: 'max: 6, sort: "count"',
      why: "max 控制展示条数（避免工具条被 40 个标签撑爆），sort 决定倒序还是按名。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "max", label: "展示标签数", kind: "number", init: 6, min: 3, max: 12, step: 1 },
    {
      key: "sort",
      label: "排序",
      kind: "select",
      init: "count",
      options: [
        { label: "按出现次数", value: "count" },
        { label: "按名称", value: "name" },
      ],
      nonLayout: true,
    },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 540,
  note: "标签筛选与类型筛选、文件夹、搜索是叠加关系，四个条件同时生效。",
};

export default makeStage("TagFilterPlugin");
