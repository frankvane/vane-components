import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "search",
  title: "关键词搜索",
  group: "toolbar",
  plugin: "SearchPlugin",
  intro: "工具栏搜索框：姓名 / 岗位 / 摘要 / 标签 / 来源任一字段命中即保留。",
  why: "「上次那个做过可视化的叫什么来着」—— 搜索比翻列快。",
  plugs: [
    {
      fn: "createSearchPlugin",
      cfg: `{}`,
      why: "非受控输入 + onChange 写 ctx.state.searchKeyword，transformData 立即过滤。",
    },
  ],
  props: [],
  note: "fields 可收窄参与搜索的字段（比如只搜姓名，避免摘要噪音）。",
};

export default makeStage("SearchPlugin");
