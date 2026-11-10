/**
 * 示例 11 · 视频时长
 *
 * 时长是素材数据的一部分（宿主写入 `duration`，单位秒），组件不读媒体元数据 ——
 * 读元数据要先下载视频，素材列表里这么干会拖垮首屏。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "duration",
  title: "视频时长",
  group: "plugin",
  plugin: "DurationPlugin",
  intro:
    "视频卡片右下角显示 01:36 / 04:12 这样的时长；数据里没有 duration 时（fallback 打开）显示占位符而不是留白。",
  why: "挑视频第一眼看时长。让组件自己去读媒体元数据意味着每张卡都要先下载视频头，等于把列表页变成下载队列。",
  plugs: [
    {
      fn: "createDurationPlugin",
      cfg: "fallback: true",
      why: "格式化 秒 → mm:ss 或 h:mm:ss；fallback 决定缺数据时是否占位。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 480,
  note: "翻到视频所在的页（视频在「视频」文件夹里），或先按类型筛出视频。",
};

export default makeStage("DurationPlugin");
