/**
 * 技术简历：现代模板 + 主题 + 时间轴 + 关键词高亮 + 数据概览，一次叠满。
 */
import React, { useMemo } from "react";
import { ResumeCore, withResumePlugins } from "vane-resume";
import {
  createTemplateSwitchPlugin,
  createThemeCustomizePlugin,
  createSectionReorderPlugin,
  createTimelineViewPlugin,
  createKeywordHighlightPlugin,
  createStatSummaryPlugin,
} from "vane-resume/custom-plugins";
import { SAMPLE_RESUME } from "../data/sample";

export const meta = {
  id: "tech-resume",
  title: "技术简历 · 现代版式",
  group: "求职",
  ref: { label: "对标 拉勾技术岗", url: "https://www.lagou.com/" },
  pain: "技术岗简历要在「一眼看懂」和「突出量化亮点」之间平衡，又得方便按 JD 调整后投递。",
  plugs: [
    { fn: "createTemplateSwitchPlugin", cfg: `{}`, why: "切到现代模板，整体观感由 CSS 变量驱动。" },
    { fn: "createThemeCustomizePlugin", cfg: `{}`, why: "预设强调色 + 取色器，适配招聘站品牌色。" },
    { fn: "createSectionReorderPlugin", cfg: `{}`, why: "把「工作」提前到「教育」之前，贴合技术岗叙事。" },
    { fn: "createTimelineViewPlugin", cfg: `{}`, why: "工作 / 教育经历切竖向时间轴，节点更清晰。" },
    {
      fn: "createKeywordHighlightPlugin",
      cfg: `{ keywords: ["React", "TypeScript"], color: "#ffd34e" }`,
      why: "按 JD 关键词命中高亮，递投前自查覆盖度。",
    },
    { fn: "createStatSummaryPlugin", cfg: `{}`, why: "基本信息区追加工作段数 / 技能数等概览徽章。" },
  ],
  props: [],
  note: "这组插件互不抢槽：模板 / 主题 / 重排改外观与顺序，时间轴 / 高亮 / 概览只增强对应区块。",
};

export default function TechResume() {
  const Resume = useMemo(
    () =>
      withResumePlugins(ResumeCore, [
        createTemplateSwitchPlugin({}),
        createThemeCustomizePlugin({}),
        createSectionReorderPlugin({}),
        createTimelineViewPlugin({}),
        createKeywordHighlightPlugin({ keywords: ["React", "TypeScript"], color: "#ffd34e" }),
        createStatSummaryPlugin({}),
      ]),
    []
  );
  return <Resume data={SAMPLE_RESUME} containerStyle={{ maxWidth: 600, margin: "0 auto" }} />;
}
