import React, { useCallback, useMemo, useState } from "react";
import { CandidateCore, withPlugins } from "vane-candidate";
import type { Candidate } from "vane-candidate";
import { createArchivePoolPlugin } from "vane-candidate/custom-plugins/ArchivePoolPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

export const meta: DemoMeta = {
  slug: "archive-pool",
  title: "人才库归档池",
  group: "toolbar",
  plugin: "ArchivePoolPlugin",
  intro: "归档的候选人从主看板消失，进「人才库」浮层；可一键恢复回看板。",
  why: "暂无匹配岗位的好候选人不能丢 —— 归档是「冷藏」不是「删除」。",
  plugs: [
    {
      fn: "createArchivePoolPlugin",
      cfg: `{}`,
      why: "transformData 把 archived 候选人滤出主看板；工具栏入口带实时计数。",
    },
  ],
  props: [],
  note: "本页是受控模式：onDataChange 把新列表回写宿主，人才库计数才能实时反映刚归档的人。",
};

export default function Stage({ log }: DemoStageProps) {
  const [data, setData] = useState<Candidate[]>(SAMPLE_CANDIDATES);

  const Board = useMemo(() => withPlugins(CandidateCore, [createArchivePoolPlugin()]), []);

  const handleChange = useCallback(
    (next: Candidate[]) => {
      setData(next);
      const onBoard = next.filter((c) => !c.archived).length;
      const pooled = next.filter((c) => c.archived).length;
      log(`看板 ${onBoard} 人 · 人才库 ${pooled} 人`);
    },
    [log]
  );

  return (
    <Board
      data={data}
      stages={SAMPLE_STAGES}
      containerStyle={{ maxWidth: 1120 }}
      onDataChange={handleChange}
    />
  );
}
