/**
 * 示例 06 · 视图切换
 *
 * 网格 / 列表两种视图共用同一份卡片数据，只是 Core 换了渲染分支。
 * 单视图模式下（views: ["grid"]）插件不渲染任何东西 —— 没有可选项的段控是噪音。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "view-switch",
  title: "网格 / 列表切换",
  group: "plugin",
  plugin: "ViewSwitchPlugin",
  intro:
    "同一个素材墙在「网格」与「列表」之间切换。列表视图把每项压成一行，适合快速核对文件名与体积。",
  why: "挑图要网格，对账要列表。让视图成为状态而不是两套组件，插件才能同时作用于两种视图。",
  plugs: [
    {
      fn: "createViewSwitchPlugin",
      cfg: 'views: ["grid", "list"]',
      why: "绑定 ctx.view / ctx.setView；views 只有一个元素时插件自动隐身。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    {
      key: "views",
      label: "可选视图",
      kind: "select",
      init: "both",
      options: [
        { label: "网格 + 列表", value: "both" },
        { label: "仅网格", value: "grid" },
      ],
      nonLayout: true,
    },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 520,
};

export default makeStage("ViewSwitchPlugin");
