/**
 * ATS 优化自检：ATS 评分 + 关键词高亮 + 电子落款，投递前的最后一道关。
 */
import React, { useMemo } from "react";
import { ResumeCore, withResumePlugins } from "vane-resume";
import {
  createAtsScorePlugin,
  createKeywordHighlightPlugin,
  createSignatureStampPlugin,
  createMultiLangPlugin,
  createAiPolishPlugin,
  createContactDesensitizePlugin,
  createPrivacyMaskPlugin,
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
      fn: "createMultiLangPlugin",
      cfg: `{ locales: [{ code: "zh", label: "中" }, { code: "en", label: "EN" }], translations: { en: { basics: { name: "Qingyang Lin", title: "Researcher", contacts: [] }, summary: "PhD candidate in Computer Science." } } }`,
      why: "评分管线的本地化前置：先出目标语言数据，后续润色 / 脱敏基于它处理。",
    },
    {
      fn: "createAiPolishPlugin",
      cfg: `{ polish: async (text) => text.replace(/负责/g, "主导") }`,
      why: "评分管线的润色前置（demo 用本地 mock），确保脱敏改写的是润色后的文本。",
    },
    {
      fn: "createContactDesensitizePlugin",
      cfg: `{}`,
      why: "评分管线的脱敏前置：电话 / 邮箱可逆脱敏，供隐私遮罩在其后处理。",
    },
    {
      fn: "createPrivacyMaskPlugin",
      cfg: `{}`,
      why: "ats-score 直接依赖它（评分读脱敏后的数据），缺失会被整体忽略。",
    },
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
  note: "ATS 评分是纯分析插件，不改数据；它读的是多语言 / 润色之后的管线结果（脱敏 priority 48 在评分 38 之后执行，不影响评分）。评分只做诊断，隐私遮罩默认关闭，投递前再按需开启。",
};

export default function AtsOptimize() {
  const Resume = useMemo(
    () =>
      withResumePlugins(ResumeCore, [
        // ats-score 声明依赖 privacy-mask，而 privacy-mask → contact-desensitize → ai-polish → multi-lang
        // 是一条硬依赖链：缺任一环，plugin-core 会把它整条忽略（评分 UI 直接不渲染），因此四者必须一起注册。
        // 数组顺序不代表执行顺序，真实顺序由各自 priority + 依赖拓扑决定。
        createMultiLangPlugin({
          locales: [
            { code: "zh", label: "中" },
            { code: "en", label: "EN" },
          ],
          translations: {
            en: {
              basics: {
                name: "Qingyang Lin",
                title: "Researcher",
                contacts: [],
                summary: "PhD candidate in Computer Science.",
              },
            },
          },
        }),
        // demo 用本地 mock 润色（与 demos/_factory.tsx 同款替换规则），真实项目注入自己的 polish 服务
        createAiPolishPlugin({
          polish: async (text) =>
            (text || "").replace(/负责/g, "主导").replace(/参与/g, "牵头"),
        }),
        createContactDesensitizePlugin({}),
        createPrivacyMaskPlugin({}),
        createAtsScorePlugin({ jobKeywords: ["React", "TypeScript", "Node"] }),
        createKeywordHighlightPlugin({ keywords: ["React", "TypeScript"], color: "#ffd34e" }),
        createSignatureStampPlugin({ stamp: "seal" }),
      ]),
    []
  );
  return <Resume data={SAMPLE_RESUME} containerStyle={{ maxWidth: 600, margin: "0 auto" }} />;
}
