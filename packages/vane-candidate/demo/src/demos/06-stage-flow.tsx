import React, { useCallback, useMemo, useRef } from "react";
import { CandidateCore, withPlugins } from "vane-candidate";
import type { Candidate } from "vane-candidate";
import { createStageFlowPlugin } from "vane-candidate/custom-plugins/StageFlowPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

export const meta: DemoMeta = {
  slug: "stage-flow",
  title: "阶段流转",
  group: "action",
  plugin: "StageFlowPlugin",
  intro: "卡片操作区「◀ 推进 ▶」，候选人沿阶段列流转；边界阶段自动禁用对应方向。",
  why: "ATS 最核心的动作：把「筛过 → 约面 → 发 offer」变成一次点击。",
  plugs: [
    {
      fn: "createStageFlowPlugin",
      cfg: `{ step: {{step}}, allowBackward: {{allowBackward}} }`,
      why: "经 ctx.moveCandidate 流转，装配层自动追加 history 并广播 candidate:change。",
    },
  ],
  props: [],
  controls: [
    { key: "step", label: "步长", kind: "number", init: 1, min: 1, max: 2, step: 1 },
    { key: "allowBackward", label: "允许回退", kind: "switch", init: true },
  ],
  note: "流转只改 stage 字段；history 由装配层统一写，ActivityLog 插件读它做时间线。",
};

const INITIAL = SAMPLE_CANDIDATES.slice(0, 5);

export default function Stage({ cfg, log }: DemoStageProps) {
  const step = Number(cfg.step ?? 1);
  const allowBackward = cfg.allowBackward !== false;

  const Board = useMemo(
    () => withPlugins(CandidateCore, [createStageFlowPlugin({ step, allowBackward })]),
    [step, allowBackward]
  );

  // 记录上一轮各候选人的阶段，onDataChange 时对比出「谁从哪挪到了哪」
  const prevStageRef = useRef<Map<string, string>>(
    new Map(INITIAL.map((c) => [c.id, c.stage]))
  );
  const handleChange = useCallback(
    (list: Candidate[]) => {
      for (const c of list) {
        const prev = prevStageRef.current.get(c.id);
        if (prev && prev !== c.stage) log(`${c.name}：${prev} → ${c.stage}`);
        prevStageRef.current.set(c.id, c.stage);
      }
    },
    [log]
  );

  return (
    <Board
      data={INITIAL}
      stages={SAMPLE_STAGES}
      containerStyle={{ maxWidth: 1120 }}
      onDataChange={handleChange}
    />
  );
}
