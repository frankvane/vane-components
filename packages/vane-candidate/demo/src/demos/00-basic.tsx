import React from "react";
import { CandidateCore, withPlugins } from "vane-candidate";
import { createScorePlugin } from "vane-candidate/custom-plugins/ScorePlugin";
import { createStageFlowPlugin } from "vane-candidate/custom-plugins/StageFlowPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

/**
 * 00 · 最小可用
 *
 * 内核起步，只叠两个最核心的插件（匹配分 + 阶段流转）——
 * 先把「装配 → 渲染」这条链跑通，再按需往 withPlugins 数组里加插件。
 *
 * 注意 import 是「消费者视角」包名（demo/vite.config.ts 的 alias 指回 src），
 * 页面里展示的源码可以原样复制到真实项目。
 */
export const meta: DemoMeta = {
  slug: "basic",
  title: "最小可用",
  group: "basic",
  intro: "内核 + 匹配分/阶段流转两个插件跑通装配链路；加插件就是往 withPlugins 数组里加一项。",
  why: "第一次接入时的起点：两个插件就能看出「徽章槽 + 操作槽 + 数据流转」的完整回路。",
  plugs: [
    { fn: "createScorePlugin", cfg: `{}`, why: "卡片右上角渲染匹配分胶囊，最简单的装饰槽插件。" },
    { fn: "createStageFlowPlugin", cfg: `{}`, why: "卡片操作区 ◀/▶，经 ctx.moveCandidate 流转并自动留 history。" },
  ],
  props: [],
  note: "withPlugins 是 withCandidatePlugins 的别名；数据流转在装配层内部态完成，宿主可用 onDataChange 同步。",
};

const Enhanced = withPlugins(CandidateCore, [
  createScorePlugin(),
  createStageFlowPlugin(),
]);

export default function Stage(_: DemoStageProps) {
  return (
    <Enhanced
      data={SAMPLE_CANDIDATES.slice(0, 6)}
      stages={SAMPLE_STAGES}
      containerStyle={{ maxWidth: 1120 }}
    />
  );
}
