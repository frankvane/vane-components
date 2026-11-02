import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "section-collapse",
  title: "板块折叠",
  group: "plugin",
  plugin: "SectionCollapsePlugin",
  intro: "为每个板块头部加折叠开关，折叠态隐藏正文；纯 state 驱动，可与时间轴并存。",
  why: "长简历先给面试官一个大纲，感兴趣再展开，避免一屏全是字。",
  plugs: [{ fn: "createSectionCollapsePlugin", cfg: "{}", why: "读写的 collapseMode / collapsed 存在 ctx.state。", }],
  props: [],
};

export default makeStage("SectionCollapsePlugin");
