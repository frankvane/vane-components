/**
 * 示例 07 · 数量统计
 *
 * 三段读数可单独开关：总量 / 当前筛出 / 已选。都在筛选与选择之后计算，
 * 所以「筛出 6」是筛选后的数量，不是总数。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "count",
  title: "数量统计",
  group: "plugin",
  plugin: "CountPlugin",
  intro:
    "工具条右侧的读数条：总量、当前筛出、已选。三段可以单独关掉，分隔符可换。",
  why: "筛选之后用户需要立刻知道「还剩多少」，否则会怀疑是不是筛空了。已选数量是批量操作前的确认位。",
  plugs: [
    {
      fn: "createCountPlugin",
      cfg: "showTotal: true, showVisible: true, showSelected: true",
      why: "读 ctx.total / ctx.filtered.length / ctx.selectedIds.length，不自己算。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "showTotal", label: "总量", kind: "switch", init: true, nonLayout: true },
    { key: "showVisible", label: "筛出", kind: "switch", init: true, nonLayout: true },
    { key: "showSelected", label: "已选", kind: "switch", init: true, nonLayout: true },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 500,
};

export default makeStage("CountPlugin");
