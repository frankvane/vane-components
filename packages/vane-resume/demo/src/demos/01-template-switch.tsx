import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "template-switch",
  title: "模板切换",
  group: "plugin",
  plugin: "TemplateSwitchPlugin",
  intro: "在经典 / 现代 / 紧凑 / 学术等版式间切换，经 CSS 变量驱动整体观感。",
  why: "同一份数据要适配不同招聘渠道的审美，模板切换比改组件快得多。",
  plugs: [{ fn: "createTemplateSwitchPlugin", cfg: `defaultId: "modern"`, why: "默认落到「现代」版式（紫调、大圆角），一眼区别于裸 Core 的经典蓝。", }],
  props: [],
};

export default makeStage("TemplateSwitchPlugin");
