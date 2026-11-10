/**
 * 示例 01 · 搜索
 *
 * 关键词走「标题 + 标签 + 文件名」三路匹配，输入防抖 180ms。
 * 搜索框带 `/` 热键：焦点不在任何输入控件时按 `/` 直接聚焦，这是素材库的高频动作。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "search",
  title: "搜索与热键",
  group: "plugin",
  plugin: "SearchPlugin",
  intro:
    "在标题、标签、文件名里做子串匹配，输入后 180ms 才触发筛选；按 / 键从任意位置跳到搜索框。",
  why: "素材一多，找东西的第一动作就是打字。搜索必须支持标签与文件名，只匹配标题等于逼用户记住命名。",
  plugs: [
    {
      fn: "createSearchPlugin",
      cfg: 'placeholder: "搜素材名 / 标签", hotkey: true, debounce: 180',
      why: "工具栏里的输入框；debounce 是插件的本地状态，不污染素材库 state。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
    { key: "hotkey", label: "/ 热键", kind: "switch", init: true, nonLayout: true },
    { key: "debounce", label: "防抖(ms)", kind: "number", init: 180, min: 0, max: 600, step: 60, nonLayout: true },
  ],
  stageHeight: 560,
  note: "搜索框输入「教程」试试：它命中的是标签，不是标题。",
};

export default makeStage("SearchPlugin");
