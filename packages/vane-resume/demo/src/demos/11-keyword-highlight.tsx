import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "keyword-highlight",
  title: "关键词高亮",
  group: "plugin",
  plugin: "KeywordHighlightPlugin",
  intro: "输入 JD 关键词，核心文本命中的词以 <mark> 高亮，配合 ATS 自检一目了然。纯 state 驱动，不抢槽。",
  why: "投递前把 JD 关键词在简历里点亮，人读机读都更顺眼。",
  plugs: [
    {
      fn: "createKeywordHighlightPlugin",
      cfg: `keywords: {{kw}}, color: "{{color}}"`,
      why: "命中词用 <mark> 包裹，颜色由 color 控制，可在工具条实时增减关键词。",
    },
  ],
  controls: [
    {
      key: "kw",
      label: "关键词",
      kind: "select",
      init: '["React","TypeScript"]',
      options: [
        { label: "React, TS", value: '["React","TypeScript"]' },
        { label: "Node, 性能", value: '["Node","性能优化"]' },
        { label: "空", value: "[]" },
      ],
      hint: "拖到「空」可看未命中态",
    },
    {
      key: "color",
      label: "高亮色",
      kind: "select",
      init: "#ffd34e",
      options: [
        { label: "黄", value: "#ffd34e" },
        { label: "青", value: "#8be0ff" },
        { label: "红", value: "#ff9d9d" },
      ],
    },
  ],
  props: [],
};

export default makeStage("KeywordHighlightPlugin");
