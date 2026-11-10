/**
 * 示例 15 · 元信息行
 *
 * 只呈现数据里已有的字段：缺 width/height 就不写分辨率，缺 folderName 就少一段。
 * 分隔点用 CSS 伪元素生成，避免拼字符串时首尾多出一个点。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "meta-line",
  title: "卡片元信息",
  group: "plugin",
  plugin: "MetaLinePlugin",
  intro:
    "标题下面一行小字：体积 / 分辨率 / 文件夹 / 标签。字段可任选组合，缺数据时少一段而不是显示「—」。",
  why: "挑素材经常要比体积和分辨率。元信息不该塞进标题，也不该在缺数据时留空位 —— 两种情况都会让卡片高低不齐。",
  plugs: [
    {
      fn: "createMetaLinePlugin",
      cfg: 'show: ["size", "dimension", "folder"], maxTags: 2',
      why: "show 决定段落与顺序；maxTags 控制标签最多几个（多了会换行撑高卡片）。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    {
      key: "fields",
      label: "字段",
      kind: "select",
      init: "full",
      options: [
        { label: "体积 + 分辨率 + 文件夹", value: "full" },
        { label: "仅体积", value: "size" },
      ],
      nonLayout: true,
    },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 500,
};

export default makeStage("MetaLinePlugin");
