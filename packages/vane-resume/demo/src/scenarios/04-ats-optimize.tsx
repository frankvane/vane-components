/**
 * ATS 优化自检：ATS 评分 + 关键词高亮 + 电子落款，投递前的最后一道关。
 */
import React, { useMemo } from "react";
import { ResumeCore, withResumePlugins } from "vane-resume";
import {
  createAtsScorePlugin,
  createKeywordHighlightPlugin,
  createSignatureStampPlugin,
} from "vane-resume/custom-plugins";
import { SAMPLE_RESUME } from "../data/sample";

export const meta = {
  id: "ats-optimize",
  title: "ATS 优化自检",
  group: "求职",
  ref: { label: "对标 ATS 解析", url: "https://www.jobscan.co/" },
  pain: "很多公司用 ATS 先机筛，缺姓名 / 量化亮点 / 命中 JD 关键词会被直接刷掉，投递前需要自检。",
  plugs: [
    {
      fn: "createAtsScorePlugin",
      cfg: `{ jobKeywords: ["React", "TypeScript", "Node"] }`,
      why: "扫描常见雷区，输出 0-100 评分与逐条改进建议。",
    },
    {
      fn: "createKeywordHighlightPlugin",
      cfg: `{ keywords: ["React", "TypeScript"], color: "#ffd34e" }`,
      why: "把 JD 关键词在正文里命中高亮，直观看到覆盖度。",
    },
    { fn: "createSignatureStampPlugin", cfg: `{ stamp: "seal" }`, why: "文末加签名 + 圆形印章，正式投递更有仪式感。" },
  ],
  props: [],
  note: "ATS 评分是纯分析插件，不改数据；它读的是经过脱敏 / 多语言之后的最终数据管道结果。",
};

export default function AtsOptimize() {
  const Resume = useMemo(
    () =>
      withResumePlugins(ResumeCore, [
        createAtsScorePlugin({ jobKeywords: ["React", "TypeScript", "Node"] }),
        createKeywordHighlightPlugin({ keywords: ["React", "TypeScript"], color: "#ffd34e" }),
        createSignatureStampPlugin({ stamp: "seal" }),
      ]),
    []
  );
  return <Resume data={SAMPLE_RESUME} containerStyle={{ maxWidth: 600, margin: "0 auto" }} />;
}
