/**
 * HR 筛选日：搜索定位 → 阶段过滤 → 批量推进 → 模板婉拒，一条流水线打完。
 */
import React, { useMemo } from "react";
import { CandidateCore, withPlugins } from "vane-candidate";
import { createFilterPlugin } from "vane-candidate/custom-plugins/FilterPlugin";
import { createSearchPlugin } from "vane-candidate/custom-plugins/SearchPlugin";
import { createBatchOpPlugin } from "vane-candidate/custom-plugins/BatchOpPlugin";
import { createRejectTplPlugin } from "vane-candidate/custom-plugins/RejectTplPlugin";
import { createRecommendSortPlugin } from "vane-candidate/custom-plugins/RecommendSortPlugin";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

export const meta = {
  id: "screening-day",
  title: "HR 筛选日",
  group: "筛选冲刺",
  ref: { label: "对标 集中筛简历场景", url: "https://developer.mozilla.org/" },
  pain: "周末要清完 100+ 投递：先搜关键词、再按阶段过滤，过线的批量推进，不合适的套模板婉拒。",
  plugs: [
    { fn: "createSearchPlugin", cfg: `{}`, why: "关键词同时匹配姓名 / 岗位 / 标签 / 来源，先缩小战场。" },
    { fn: "createFilterPlugin", cfg: `{}`, why: "阶段 / 标签下拉精确过滤，只看「已投递」这一层。" },
    { fn: "createBatchOpPlugin", cfg: `{}`, why: "批量模式全选后一键流转到「筛选中」，免去逐张点击。" },
    { fn: "createRejectTplPlugin", cfg: `{}`, why: "不合适的套内置模板婉拒，确认后直接流转到 rejected。" },
    { fn: "createRecommendSortPlugin", cfg: `{ by: "fresh", desc: true }`, why: "按投递时间降序，先处理新鲜的、过期的放后面。" },
  ],
  props: [],
  note: "批量归档只写 archived 标记；要让看板上消失需配合 ArchivePool —— 见「人才库复盘」场景。",
};

export default function ScreeningDay() {
  const Board = useMemo(
    () =>
      withPlugins(CandidateCore, [
        createRecommendSortPlugin({ by: "fresh", desc: true }),
        createSearchPlugin(),
        createFilterPlugin(),
        createBatchOpPlugin(),
        createRejectTplPlugin(),
      ]),
    []
  );
  return <Board data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ minWidth: 1180 }} />;
}
