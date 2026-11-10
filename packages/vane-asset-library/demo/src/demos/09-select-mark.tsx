/**
 * 示例 09 · 选择序号
 *
 * 选中卡片左上角出现圆形标记，可切换成「1 / 2 / 3」的序号 —— 顺序就是用户点击顺序，
 * 批量插入编辑器时，序号本身有语义。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "select-mark",
  title: "选择标记与序号",
  group: "plugin",
  plugin: "SelectMarkPlugin",
  intro:
    "选中的卡片左上角出现实色圆形标记；打开序号后按点击顺序编号，取消中间一项会重排。",
  why: "多选必须给一个不会看错的视觉反馈。用实色而不是半透明叠层，是因为叠层在浅色素材上会读不清（对比度不可控）。",
  plugs: [
    {
      fn: "createSelectMarkPlugin",
      cfg: "showIndex: true",
      why: "读 ctx.selectedIds 的下标定位序号；不可选素材（处理中/失败）不显示标记。",
    },
  ],
  props: ["multiple", "pageSize={{pageSize}}"],
  controls: [
    { key: "multiple", label: "多选", kind: "switch", init: true, nonLayout: true },
    { key: "showIndex", label: "显示序号", kind: "switch", init: true, nonLayout: true },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 500,
};

export default makeStage("SelectMarkPlugin");
