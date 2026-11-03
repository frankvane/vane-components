import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "view-switch",
  title: "看板 / 列表切换",
  group: "toolbar",
  plugin: "ViewSwitchPlugin",
  intro: "工具栏互斥按钮切换视图：列表模式由 renderCards 内容覆盖槽整体接管渲染。",
  why: "看板适合「看分布」，列表适合「快速过一遍」—— 同一份数据两种密度。",
  plugs: [
    {
      fn: "createViewSwitchPlugin",
      cfg: `{ pageSize: {{pageSize}} }`,
      why: "kanban 模式返回 null 回落核心默认看板；list 模式渲染紧凑表格，pageSize 可截断。",
    },
  ],
  props: [],
  controls: [
    { key: "pageSize", label: "每页条数", kind: "number", init: 0, min: 0, max: 12, step: 1, hint: "0 = 不分页" },
  ],
  note: "内容覆盖槽是「单值槽」：多个插件都实现 renderCards 时最高 priority 胜出。",
};

export default makeStage("ViewSwitchPlugin");
