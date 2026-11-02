/**
 * 学术 CV：紧凑模板 + 折叠 + 多语言 + 附件预览，偏阅读密度与可归档。
 */
import React, { useMemo } from "react";
import { ResumeCore, withResumePlugins } from "vane-resume";
import {
  createThemeCustomizePlugin,
  createSectionCollapsePlugin,
  createMultiLangPlugin,
  createAttachmentPreviewPlugin,
} from "vane-resume/custom-plugins";
import { SAMPLE_RESUME } from "../data/sample";

export const meta = {
  id: "academic-cv",
  title: "学术 CV · 紧凑阅读",
  group: "求职",
  ref: { label: "对标 高校求职", url: "https://www.zhipin.com/" },
  pain: "学术 / 科研岗简历信息密度高，需要可折叠的长段落、中英切换，以及论文 / 证书的附件归档。",
  plugs: [
    { fn: "createThemeCustomizePlugin", cfg: `{}`, why: "压低强调色饱和度，偏沉稳的学术观感。" },
    { fn: "createSectionCollapsePlugin", cfg: `{}`, why: "每个板块头部加折叠开关，长简历可分段收起。" },
    { fn: "createMultiLangPlugin", cfg: `{ locales: [{ code: "zh", label: "中" }, { code: "en", label: "EN" }], translations: { en: { basics: { name: "Qingyang Lin", title: "Researcher" }, summary: "PhD candidate in CS." } } }`, why: "中英切换，整体翻译文本字段，缺失字段保留原文降级。" },
    { fn: "createAttachmentPreviewPlugin", cfg: `{}`, why: "论文 PDF / 证书图片集中预览，便于归档投递。" },
  ],
  props: [],
  tone: "light" as const,
};

export default function AcademicCv() {
  const Resume = useMemo(
    () =>
      withResumePlugins(ResumeCore, [
        createThemeCustomizePlugin({}),
        createSectionCollapsePlugin({}),
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
        createAttachmentPreviewPlugin({}),
      ]),
    []
  );
  return (
    <Resume data={SAMPLE_RESUME} containerStyle={{ maxWidth: 600, margin: "0 auto" }} />
  );
}
