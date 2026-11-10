/**
 * 示例 08 · 全选当前页
 *
 * 「全选」只作用于当前页里 `status === "ready"` 的项：未就绪的素材不该被批量删除。
 * 已被 maxSelected 卡住的项会被跳过，且不弹提示 —— 上限是宿主定的规则，不该在卡片层吵。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "select-all",
  title: "全选当前页",
  group: "plugin",
  plugin: "SelectAllPlugin",
  intro:
    "一键选中当前页所有「就绪」素材，再点一次清空。处理中 / 失败的素材不会被卷进来。",
  why: "批量下载、批量移动都需要一个「这一页我都要」的入口。全选范围限定当前页，是为了跟分页的语义对齐。",
  plugs: [
    {
      fn: "createSelectAllPlugin",
      why: "调 ctx.selectAllVisible() / ctx.clearSelection()；是否显示取决于当前页有无可选且未选的项。",
    },
  ],
  props: ["multiple", "maxSelected={{maxSelected}}", "pageSize={{pageSize}}"],
  controls: [
    { key: "multiple", label: "多选", kind: "switch", init: true, nonLayout: true },
    { key: "maxSelected", label: "选择上限", kind: "number", init: 12, min: 0, max: 24, step: 1 },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 24, step: 6 },
  ],
  stageHeight: 500,
  note: "把上限调到 3 再点全选：只有前 3 个就绪项被选中，其余静默跳过，日志里能数出来。",
};

export default makeStage("SelectAllPlugin");
