/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），由迁移脚本生成；
 *  2. `create.ts(x)` —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { ResumeData, ResumePlugin } from "vane-resume";
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

export type PluginGroup = "layout" | "data" | "interaction";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  layout: "版式与视觉",
  data: "数据与隐私",
  interaction: "交互与产出",
};

export const GROUP_ORDER: PluginGroup[] = ["layout", "data", "interaction"];

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: Array<{ name: string; type: string; default: string; description: string }>;
  example?: string;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginInfo {
  /** 目录名，同时是插件 name，如 TemplateSwitchPlugin */
  dir: string;
  /** 工厂名，如 createTemplateSwitchPlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => ResumePlugin<ResumeData>;
}

const DOCS = import.meta.glob<PluginDocShape>("/src/custom-plugins/*/doc.json", {
  eager: true,
  import: "default",
});

const RAW = import.meta.glob<string>("/src/custom-plugins/*/create.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const dirOf = (path: string) =>
  path.replace(/^.*\/custom-plugins\//, "").replace(/\/.*$/, "");

function priorityOf(dir: string): number {
  const path = Object.keys(RAW).find((p) => dirOf(p) === dir);
  const src = path ? RAW[path] : "";
  const m = /priority:\s*(\d+)/.exec(src);
  return m ? Number(m[1]) : 0;
}

function docOf(dir: string): PluginDocShape {
  const path = Object.keys(DOCS).find((p) => dirOf(p) === dir);
  return path ? DOCS[path] : { name: dir, description: "（缺少 doc.json）" };
}

type Def = {
  dir: string;
  group: PluginGroup;
  make: () => ResumePlugin<ResumeData>;
};

const DEFS: Def[] = [
  // ---------- layout ----------
  { dir: "TemplateSwitchPlugin", group: "layout", make: () => createTemplateSwitchPlugin({}) },
  { dir: "ThemeCustomizePlugin", group: "layout", make: () => createThemeCustomizePlugin({}) },
  { dir: "SectionReorderPlugin", group: "layout", make: () => createSectionReorderPlugin({}) },
  { dir: "SectionCollapsePlugin", group: "layout", make: () => createSectionCollapsePlugin({}) },
  { dir: "TimelineViewPlugin", group: "layout", make: () => createTimelineViewPlugin({}) },

  // ---------- data ----------
  { dir: "StatSummaryPlugin", group: "data", make: () => createStatSummaryPlugin({}) },
  {
    dir: "MultiLangPlugin",
    group: "data",
    make: () =>
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
  },
  { dir: "PrivacyMaskPlugin", group: "data", make: () => createPrivacyMaskPlugin({}) },
  {
    dir: "ContactDesensitizePlugin",
    group: "data",
    make: () => createContactDesensitizePlugin({}),
  },
  {
    dir: "AtsScorePlugin",
    group: "data",
    make: () => createAtsScorePlugin({ jobKeywords: ["React", "TypeScript", "Node"] }),
  },
  { dir: "VersioningPlugin", group: "data", make: () => createVersioningPlugin({}) },
  { dir: "DeliverTrackPlugin", group: "data", make: () => createDeliverTrackPlugin({}) },

  // ---------- interaction ----------
  {
    dir: "KeywordHighlightPlugin",
    group: "interaction",
    make: () => createKeywordHighlightPlugin({ keywords: ["React", "TypeScript"], color: "#ffd34e" }),
  },
  { dir: "SignatureStampPlugin", group: "interaction", make: () => createSignatureStampPlugin({ stamp: "seal" }) },
  { dir: "QrCodePlugin", group: "interaction", make: () => createQrCodePlugin({ content: "https://vane.dev/r/qingyang" }) },
  {
    dir: "ShareLinkPlugin",
    group: "interaction",
    make: () =>
      createShareLinkPlugin({
        onBuildUrl: (data) =>
          "https://vane.dev/r/" + encodeURIComponent((data as { basics?: { name?: string } }).basics?.name ?? "resume"),
      }),
  },
  { dir: "ExportPdfPlugin", group: "interaction", make: () => createExportPdfPlugin({}) },
  { dir: "PrintOptimizePlugin", group: "interaction", make: () => createPrintOptimizePlugin({}) },
  { dir: "AttachmentPreviewPlugin", group: "interaction", make: () => createAttachmentPreviewPlugin({}) },
  { dir: "AiPolishPlugin", group: "interaction", make: () => createAiPolishPlugin({}) },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir.replace(/Plugin$/, "")}Plugin`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    make: def.make,
  };
}).sort(
  (a, b) =>
    GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || b.priority - a.priority
);

/** 默认勾选：够看出「一个可用的简历」全貌，又不互相干扰 */
export const DEFAULT_ON = [
  "TemplateSwitch",
  "ThemeCustomize",
  "SectionReorder",
  "SectionCollapse",
  "TimelineView",
  "StatSummary",
  "MultiLang",
  "PrivacyMask",
  "ContactDesensitize",
  "AtsScore",
  "KeywordHighlight",
  "SignatureStamp",
  "QrCode",
  "ShareLink",
  "AttachmentPreview",
];
