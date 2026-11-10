/**
 * 示例 17 · 分页
 *
 * page 越界会被夹紧到有效范围：筛选把结果从 48 项缩到 6 项时，停在第 4 页不会白屏。
 * 分页器是「页码窗口」式（当前页左右各两页 + 首尾），不是把所有页平铺。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "pagination",
  title: "分页",
  group: "plugin",
  plugin: "PaginationPlugin",
  intro:
    "页脚分页器：上一页 / 页码窗口 / 下一页 + 每页条数选择。改每页条数后页码自动回到 1。",
  why: "素材库动辄几千项，虚拟滚动做不好会丢焦点、丢选中态。分页是最稳的方案，也能让「全选当前页」有明确边界。",
  plugs: [
    {
      fn: "createPaginationPlugin",
      cfg: "pageSizes: [6, 12, 24]",
      why: "绑定 ctx.page / ctx.pageCount / ctx.setPage / ctx.setPageSize；window 控制页码窗口宽度。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 560,
  note: "把每页调到 6，翻到第 5 页，再用搜索框输入「教程」—— 页码会被夹紧，不会停留在空页。",
};

export default makeStage("PaginationPlugin");
