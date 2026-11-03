/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），随插件目录交付；
 *  2. `create.tsx`   —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { CandidatePlugin } from "vane-candidate";
import { createScorePlugin } from "vane-candidate/custom-plugins/ScorePlugin";
import { createDupCheckPlugin } from "vane-candidate/custom-plugins/DupCheckPlugin";
import { createTagPlugin } from "vane-candidate/custom-plugins/TagPlugin";
import { createOfferPlugin } from "vane-candidate/custom-plugins/OfferPlugin";
import { createStarPlugin } from "vane-candidate/custom-plugins/StarPlugin";
import { createStageFlowPlugin } from "vane-candidate/custom-plugins/StageFlowPlugin";
import { createNotePlugin } from "vane-candidate/custom-plugins/NotePlugin";
import { createInterviewSlotPlugin } from "vane-candidate/custom-plugins/InterviewSlotPlugin";
import { createRejectTplPlugin } from "vane-candidate/custom-plugins/RejectTplPlugin";
import { createFilterPlugin } from "vane-candidate/custom-plugins/FilterPlugin";
import { createSearchPlugin } from "vane-candidate/custom-plugins/SearchPlugin";
import { createBatchOpPlugin } from "vane-candidate/custom-plugins/BatchOpPlugin";
import { createViewSwitchPlugin } from "vane-candidate/custom-plugins/ViewSwitchPlugin";
import { createArchivePoolPlugin } from "vane-candidate/custom-plugins/ArchivePoolPlugin";
import { createExportPlugin } from "vane-candidate/custom-plugins/ExportPlugin";
import { createStatsPlugin } from "vane-candidate/custom-plugins/StatsPlugin";
import { createActivityLogPlugin } from "vane-candidate/custom-plugins/ActivityLogPlugin";
import { createRecommendSortPlugin } from "vane-candidate/custom-plugins/RecommendSortPlugin";
import { createContactMaskPlugin } from "vane-candidate/custom-plugins/ContactMaskPlugin";

export type PluginGroup = "badge" | "action" | "toolbar" | "pipeline";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  badge: "徽章与标记",
  action: "动作与浮层",
  toolbar: "工具栏与视图",
  pipeline: "管道与统计",
};

export const GROUP_ORDER: PluginGroup[] = ["badge", "action", "toolbar", "pipeline"];

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
  /** 目录名，同时是插件 name，如 ScorePlugin */
  dir: string;
  /** 工厂名，如 createScorePlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => CandidatePlugin;
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
  make: () => CandidatePlugin;
};

const DEFS: Def[] = [
  // ---------- badge ----------
  { dir: "ScorePlugin", group: "badge", make: () => createScorePlugin({ goodThreshold: 80 }) },
  { dir: "DupCheckPlugin", group: "badge", make: () => createDupCheckPlugin({}) },
  {
    dir: "TagPlugin",
    group: "badge",
    make: () => createTagPlugin({ suggestTags: ["重点", "备选", "急招", "内推"] }),
  },
  { dir: "OfferPlugin", group: "badge", make: () => createOfferPlugin() },

  // ---------- action ----------
  { dir: "StarPlugin", group: "action", make: () => createStarPlugin({ pinTop: true }) },
  { dir: "StageFlowPlugin", group: "action", make: () => createStageFlowPlugin({ step: 1 }) },
  { dir: "NotePlugin", group: "action", make: () => createNotePlugin({ authorName: "演示 HR" }) },
  {
    dir: "InterviewSlotPlugin",
    group: "action",
    make: () =>
      createInterviewSlotPlugin({
        slots: ["周二 14:00", "周三 10:00", "周四 16:00"],
        interviewers: ["王工", "李总监"],
        modes: ["onsite", "video"],
      }),
  },
  { dir: "RejectTplPlugin", group: "action", make: () => createRejectTplPlugin({}) },

  // ---------- toolbar ----------
  { dir: "FilterPlugin", group: "toolbar", make: () => createFilterPlugin() },
  { dir: "SearchPlugin", group: "toolbar", make: () => createSearchPlugin() },
  { dir: "BatchOpPlugin", group: "toolbar", make: () => createBatchOpPlugin() },
  { dir: "ViewSwitchPlugin", group: "toolbar", make: () => createViewSwitchPlugin({ pageSize: 0 }) },
  { dir: "ArchivePoolPlugin", group: "toolbar", make: () => createArchivePoolPlugin() },
  { dir: "ExportPlugin", group: "toolbar", make: () => createExportPlugin({ filename: "vane-candidates" }) },

  // ---------- pipeline ----------
  { dir: "StatsPlugin", group: "pipeline", make: () => createStatsPlugin({ columnCount: true }) },
  { dir: "ActivityLogPlugin", group: "pipeline", make: () => createActivityLogPlugin({ maxEntries: 50 }) },
  {
    dir: "RecommendSortPlugin",
    group: "pipeline",
    make: () => createRecommendSortPlugin({ by: "score", desc: true }),
  },
  {
    dir: "ContactMaskPlugin",
    group: "pipeline",
    make: () => createContactMaskPlugin({ maskEmail: true, maskPhone: true }),
  },
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
