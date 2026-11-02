import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "theme-customize",
  title: "主题配色",
  group: "plugin",
  plugin: "ThemeCustomizePlugin",
  intro: "预设强调色 + 自定义取色器，经 CSS 变量注入容器。",
  why: "招聘站 / 个人主页有品牌色，主题定制让简历和它的承载页长得像一家人。",
  plugs: [
    {
      fn: "createThemeCustomizePlugin",
      cfg: `presets: [{ id: "green", label: "绿", vars: { "--vr-accent": "#1f9d55" } }, { id: "orange", label: "橙", vars: { "--vr-accent": "#e8590c" } }]`,
      why: "把非蓝配色排到第一，挂载即生效（默认蓝会跟裸 Core 看着一样）。",
    },
  ],
  props: [],
};

export default makeStage("ThemeCustomizePlugin");
