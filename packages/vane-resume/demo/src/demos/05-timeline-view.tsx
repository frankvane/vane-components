import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "timeline-view",
  title: "时间轴视图",
  group: "plugin",
  plugin: "TimelineViewPlugin",
  intro: "把工作 / 教育经历从列表切换为竖向时间轴（圆点 + 连线 + 日期）。",
  why: "经历多、跨度长时，时间轴比平铺列表更能体现成长曲线。",
  plugs: [{ fn: "createTimelineViewPlugin", cfg: "{}", why: "覆盖 renderWork / renderEducation 为时间轴渲染。", }],
  props: [],
};

export default makeStage("TimelineViewPlugin");
