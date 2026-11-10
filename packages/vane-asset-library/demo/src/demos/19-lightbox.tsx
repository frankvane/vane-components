/**
 * 示例 19 · 大图预览
 *
 * 双击卡片（或按 Enter）打开浮层：Esc 关闭、左右方向键换图、关闭后焦点回到原来那张卡。
 * 浮层挂在容器内部而不是 portal 到 body —— 这样容器的 CSS 作用域与主题令牌都还在。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "lightbox",
  title: "大图预览",
  group: "plugin",
  plugin: "LightBoxPlugin",
  intro:
    "双击任一素材打开大图浮层，浮层里可左右翻、Esc 关闭；关闭后键盘焦点回到打开它的那张卡。",
  why: "缩略图看不清细节，点开大图是刚需。焦点还原是可访问性的硬要求 —— 否则键盘用户关掉浮层就「丢」在页面顶部。",
  plugs: [
    {
      fn: "createLightBoxPlugin",
      cfg: "arrows: true, restoreFocus: true",
      why: "覆盖层槽位的唯一使用者；翻页范围是当前筛选结果，不是当前页。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 520,
  note: "浮层的翻页范围是「整个筛选结果」，所以翻到第 12 页之后还能继续往后翻。",
};

export default makeStage("LightBoxPlugin");
