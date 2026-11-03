/**
 * 逐项示例的共享舞台工厂
 *
 * 每个 `NN-slug.tsx` 只负责声明 `meta` 并导出 `makeStage("<Dir>Plugin")`，
 * 真正的插件装配集中在这里：一份 MAKERS 表，把所有工厂名 → 演示用的装配函数。
 * 这样 20 个示例文件都是「数据」，不重复写 withPlugins / SAMPLE_CANDIDATES。
 *
 * 注意文件名以 `_` 开头，`[0-9]*.tsx` 的 glob 不会把它当成一页。
 */
import React, { useMemo } from "react";
import { CandidateCore, withPlugins } from "vane-candidate";
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
import type { DemoCfg, DemoStageProps } from "./types";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

export type Maker = (cfg: DemoCfg) => CandidatePlugin;

const asStr = (v: number | boolean | string | undefined, fallback = "") =>
  v === undefined ? fallback : String(v);

export const MAKERS: Record<string, Maker> = {
  // ---------- badge ----------
  ScorePlugin: (cfg) =>
    createScorePlugin({
      goodThreshold: Number(cfg.goodThreshold ?? 80),
      warnThreshold: Number(cfg.warnThreshold ?? 60),
    }),
  DupCheckPlugin: () => createDupCheckPlugin({ fields: ["name", "email", "phone"] }),
  TagPlugin: (cfg) =>
    createTagPlugin({
      suggestTags: ["重点", "备选", "急招", "内推"],
      maxTags: Number(cfg.maxTags ?? 8),
    }),
  OfferPlugin: () => createOfferPlugin(),

  // ---------- action ----------
  StarPlugin: (cfg) => createStarPlugin({ pinTop: cfg.pinTop !== false }),
  StageFlowPlugin: (cfg) =>
    createStageFlowPlugin({
      step: Number(cfg.step ?? 1),
      allowBackward: cfg.allowBackward !== false,
    }),
  NotePlugin: (cfg) => createNotePlugin({ authorName: asStr(cfg.author, "演示 HR") }),
  InterviewSlotPlugin: () =>
    createInterviewSlotPlugin({
      slots: ["周二 14:00", "周三 10:00", "周四 16:00"],
      interviewers: ["王工", "李总监"],
      modes: ["onsite", "video"],
    }),
  RejectTplPlugin: () => createRejectTplPlugin({ targetStage: "rejected" }),

  // ---------- toolbar ----------
  FilterPlugin: () => createFilterPlugin(),
  SearchPlugin: () => createSearchPlugin(),
  BatchOpPlugin: () => createBatchOpPlugin(),
  ViewSwitchPlugin: (cfg) => createViewSwitchPlugin({ pageSize: Number(cfg.pageSize ?? 0) }),
  ArchivePoolPlugin: () => createArchivePoolPlugin(),
  ExportPlugin: (cfg) => createExportPlugin({ filename: asStr(cfg.filename, "vane-candidates") }),

  // ---------- pipeline ----------
  StatsPlugin: (cfg) => createStatsPlugin({ columnCount: cfg.columnCount !== false }),
  ActivityLogPlugin: (cfg) => createActivityLogPlugin({ maxEntries: Number(cfg.maxEntries ?? 20) }),
  RecommendSortPlugin: (cfg) =>
    createRecommendSortPlugin({
      by: asStr(cfg.by, "score") === "fresh" ? "fresh" : "score",
      desc: cfg.desc !== false,
    }),
  ContactMaskPlugin: (cfg) =>
    createContactMaskPlugin({
      maskEmail: cfg.maskEmail !== false,
      maskPhone: cfg.maskPhone !== false,
    }),
};

export function makeStage(dir: string) {
  const maker = MAKERS[dir];
  if (!maker) throw new Error(`未注册的示例插件：${dir}`);
  return function Stage({ cfg }: DemoStageProps) {
    const Board = useMemo(
      () => withPlugins(CandidateCore, [maker(cfg)]),
      // 控件值序列化后做依赖：拖控件 → 重新装配
      [JSON.stringify(cfg)] // eslint-disable-line react-hooks/exhaustive-deps
    );
    return (
      <Board
        data={SAMPLE_CANDIDATES}
        stages={SAMPLE_STAGES}
        containerStyle={{ maxWidth: 1120 }}
      />
    );
  };
}
