/**
 * 示例 05 · 排序
 *
 * 四个排序键：名称 / 创建时间 / 体积 / 时长。缺值的素材恒沉底（不管是升序还是降序），
 * 否则「按时长排」会把一堆没有时长的图片顶到最前面。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "sort",
  title: "排序",
  group: "plugin",
  plugin: "SortPlugin",
  intro:
    "排序键可在名称 / 创建时间 / 体积 / 时长之间切换，方向再点一次取反；缺该字段的素材永远排在最后。",
  why: "「最近的素材」和「最大的素材」是两个完全不同的找东西场景。缺值恒沉底是硬约束 —— 否则图片会被「按时长排」挤成一堆。",
  plugs: [
    {
      fn: "createSortPlugin",
      why: "绑定 ctx.sortKey / ctx.sortDir 与 setSort；图标用纯文本箭头，不引图标库。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 520,
  note: "排序是稳定排序：同值时保持传入顺序，不会在翻页时跳来跳去。",
};

export default makeStage("SortPlugin");
