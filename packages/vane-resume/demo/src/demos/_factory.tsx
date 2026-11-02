/**
 * 逐项示例的共享舞台工厂
 *
 * 每个 `NN-slug.tsx` 只负责声明 `meta` 并导出 `makeStage("<Dir>Plugin")`，
 * 真正的插件装配集中在这里：一份 MAKERS 表，把所有工厂名 → 演示用的装配函数。
 * 这样 20 个示例文件都是「数据」，不重复写 withResumePlugins / SAMPLE_RESUME。
 *
 * 注意文件名以 `_` 开头，`[0-9]*.tsx` 的 glob 不会把它当成一页。
 */
import React, { useMemo } from "react";
import { ResumeCore, withResumePlugins } from "vane-resume";
import type { ResumeData, ResumePlugin } from "vane-resume";
import type { DemoCfg, DemoStageProps } from "./types";
import { SAMPLE_RESUME } from "../data/sample";
import {
  createTemplateSwitchPlugin,
  createThemeCustomizePlugin,
  createSectionReorderPlugin,
  createSectionCollapsePlugin,
  createTimelineViewPlugin,
  createStatSummaryPlugin,
  createMultiLangPlugin,
  createPrivacyMaskPlugin,
  createContactDesensitizePlugin,
  createAtsScorePlugin,
  createVersioningPlugin,
  createDeliverTrackPlugin,
  createKeywordHighlightPlugin,
  createSignatureStampPlugin,
  createQrCodePlugin,
  createShareLinkPlugin,
  createExportPdfPlugin,
  createPrintOptimizePlugin,
  createAttachmentPreviewPlugin,
  createAiPolishPlugin,
} from "vane-resume/custom-plugins";

export type Maker = (cfg: DemoCfg) => ResumePlugin<ResumeData>;

const asStr = (v: number | boolean | string | undefined, fallback = "") =>
  v === undefined ? fallback : String(v);

export const MAKERS: Record<string, Maker> = {
  TemplateSwitchPlugin: () => createTemplateSwitchPlugin({ defaultId: "modern" }),
  ThemeCustomizePlugin: () =>
    createThemeCustomizePlugin({
      // 默认就上一套非蓝配色，否则和裸 Core 看着一样
      presets: [
        { id: "green", label: "绿", vars: { "--vr-accent": "#1f9d55" } },
        { id: "orange", label: "橙", vars: { "--vr-accent": "#e8590c" } },
        { id: "blue", label: "蓝", vars: { "--vr-accent": "#2f6feb" } },
        { id: "mono", label: "墨", vars: { "--vr-accent": "#1f2328" } },
      ],
    }),
  SectionReorderPlugin: () =>
    createSectionReorderPlugin({
      // 默认把「技能」提到「工作」之前，一眼就能看出板块被重排
      sections: ["basics", "skills", "work", "education", "projects", "extra", "attachments"],
    }),
  SectionCollapsePlugin: () => createSectionCollapsePlugin({}),
  TimelineViewPlugin: () => createTimelineViewPlugin({}),
  StatSummaryPlugin: () => createStatSummaryPlugin({}),
  MultiLangPlugin: () =>
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
  PrivacyMaskPlugin: () => createPrivacyMaskPlugin({}),
  ContactDesensitizePlugin: () => createContactDesensitizePlugin({}),
  AtsScorePlugin: () => createAtsScorePlugin({ jobKeywords: ["React", "TypeScript", "Node"] }),
  VersioningPlugin: () => createVersioningPlugin({}),
  DeliverTrackPlugin: () => createDeliverTrackPlugin({}),
  KeywordHighlightPlugin: (cfg) => {
    const rawKw = asStr(cfg.kw, '["React","TypeScript"]');
    let keywords: string[] = ["React", "TypeScript"];
    try {
      const parsed = rawKw.trim().startsWith("[")
        ? JSON.parse(rawKw)
        : rawKw.split(",").map((s) => s.trim()).filter(Boolean);
      if (Array.isArray(parsed)) keywords = parsed;
    } catch {
      /* 控件值异常时回退默认 */
    }
    return createKeywordHighlightPlugin({ keywords, color: asStr(cfg.color, "#ffd34e") });
  },
  SignatureStampPlugin: (cfg) =>
    createSignatureStampPlugin({ stamp: asStr(cfg.stamp, "seal") === "none" ? undefined : "seal" }),
  QrCodePlugin: () => createQrCodePlugin({ content: "https://vane.dev/r/qingyang" }),
  ShareLinkPlugin: () =>
    createShareLinkPlugin({
      onBuildUrl: (data) =>
        "https://vane.dev/r/" +
        encodeURIComponent((data as { basics?: { name?: string } }).basics?.name ?? "resume"),
    }),
  ExportPdfPlugin: () => createExportPdfPlugin({}),
  PrintOptimizePlugin: () => createPrintOptimizePlugin({}),
  AttachmentPreviewPlugin: () => createAttachmentPreviewPlugin({}),
  AiPolishPlugin: () =>
    createAiPolishPlugin({
      // demo 用本地 mock 润色：把常见动词换成更主动的表达，并打上 ✦ 标记，便于直观看到数据被改写
      polish: async (text) => {
        const t = (text || "").trim();
        if (!t) return text;
        const out = t
          .replace(/负责/g, "主导")
          .replace(/参与/g, "牵头")
          .replace(/开发/g, "设计开发")
          .replace(/协助/g, "协同");
        return out.includes("✦") ? out : `${out} ✦`;
      },
    }),
};

export function makeStage(dir: string) {
  const maker = MAKERS[dir];
  if (!maker) throw new Error(`未注册的示例插件：${dir}`);
  return function Stage({ cfg }: DemoStageProps) {
    const Resume = useMemo(
      () => withResumePlugins(ResumeCore, [maker(cfg)]),
      [JSON.stringify(cfg)]
    );
    return (
      <Resume data={SAMPLE_RESUME} containerStyle={{ maxWidth: 560, margin: "0 auto" }} />
    );
  };
}
