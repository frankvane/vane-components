/**
 * 日常刷简历：分数着色 + 推荐排序先看分高的，随手备注、随手推进。
 */
import React, { useMemo } from "react";
import { CandidateCore, withPlugins } from "vane-candidate";
import { createScorePlugin } from "vane-candidate/custom-plugins/ScorePlugin";
import { createStageFlowPlugin } from "vane-candidate/custom-plugins/StageFlowPlugin";
import { createNotePlugin } from "vane-candidate/custom-plugins/NotePlugin";
import { createRecommendSortPlugin } from "vane-candidate/custom-plugins/RecommendSortPlugin";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

export const meta = {
  id: "daily-review",
  title: "日常刷简历",
  group: "日常运营",
  ref: { label: "对标 内推日常盘点", url: "https://developer.mozilla.org/" },
  pain: "每天早上要过一遍新投递：先看谁分高，看完写两笔备注，顺手把能推进的推进 —— 四个动作要一气呵成。",
  plugs: [
    { fn: "createRecommendSortPlugin", cfg: `{ by: "score", desc: true }`, why: "匹配分高的排在各列最前，打开看板就知道先聊谁。" },
    { fn: "createScorePlugin", cfg: `{}`, why: "分数胶囊按阈值着色，红橙绿把优先级编码进视觉。" },
    { fn: "createStageFlowPlugin", cfg: `{}`, why: "看完直接点 ▶ 推进到下一阶段，history 自动记录。" },
    { fn: "createNotePlugin", cfg: `{ authorName: "张HR" }`, why: "电话沟通结论落到候选人身上，浮层两步完成。" },
  ],
  props: [],
  note: "排序经 transformData 只影响列内顺序；推进 / 备注由装配层落内部态，宿主可用 onDataChange 持久化。",
};

export default function DailyReview() {
  const Board = useMemo(
    () =>
      withPlugins(CandidateCore, [
        createRecommendSortPlugin({ by: "score", desc: true }),
        createScorePlugin(),
        createStageFlowPlugin(),
        createNotePlugin({ authorName: "张HR" }),
      ]),
    []
  );
  return <Board data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ minWidth: 1180 }} />;
}
