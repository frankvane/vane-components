import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "export",
  title: "CSV 导出",
  group: "toolbar",
  plugin: "ExportPlugin",
  intro: "工具栏「导出 CSV」：把当前看板数据（经筛选 / 排序管道后）按列导出，带 BOM。",
  why: "周报要附件、老板要表格：导出的是管道末态，所见即所得。",
  plugs: [
    {
      fn: "createExportPlugin",
      cfg: `{ filename: "{{filename}}" }`,
      why: "内置 8 列（姓名 / 岗位 / 阶段 / 匹配分 / 邮箱 / 手机号 / 来源 / 投递时间），columns 可追加。",
    },
  ],
  props: [],
  controls: [
    {
      key: "filename",
      label: "文件名",
      kind: "select",
      init: "vane-candidates",
      options: [
        { label: "vane-candidates", value: "vane-candidates" },
        { label: "interview-week", value: "interview-week" },
      ],
    },
  ],
  note: "csvCell 做了公式注入防护（= + - @ 开头会被前置单引号）；日期后缀自动拼接。",
};

export default makeStage("ExportPlugin");
