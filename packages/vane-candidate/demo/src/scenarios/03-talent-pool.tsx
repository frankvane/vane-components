/**
 * 人才库复盘：归档池 + 星标 + 标签整理人才库，脱敏展示，导出与漏斗收尾。
 * 受控模式：onDataChange 把新列表回写宿主，归档 / 恢复的人才库计数才实时。
 */
import React, { useCallback, useMemo, useState } from "react";
import { CandidateCore, withPlugins } from "vane-candidate";
import type { Candidate } from "vane-candidate";
import { createArchivePoolPlugin } from "vane-candidate/custom-plugins/ArchivePoolPlugin";
import { createStarPlugin } from "vane-candidate/custom-plugins/StarPlugin";
import { createTagPlugin } from "vane-candidate/custom-plugins/TagPlugin";
import { createContactMaskPlugin } from "vane-candidate/custom-plugins/ContactMaskPlugin";
import { createExportPlugin } from "vane-candidate/custom-plugins/ExportPlugin";
import { createStatsPlugin } from "vane-candidate/custom-plugins/StatsPlugin";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

export const meta = {
  id: "talent-pool",
  title: "人才库复盘",
  group: "季度复盘",
  ref: { label: "对标 人才库季度盘点", url: "https://developer.mozilla.org/" },
  pain: "季度末盘点人才库：把好苗子星标 + 打标签，联系方式默认脱敏，最后导出一份给老板、看一眼漏斗。",
  plugs: [
    { fn: "createArchivePoolPlugin", cfg: `{}`, why: "归档的候选人收进人才库浮层，可恢复；主看板只留活跃流水线。" },
    { fn: "createStarPlugin", cfg: `{ pinTop: true }`, why: "好苗子星标置顶，复盘时优先过目。" },
    { fn: "createTagPlugin", cfg: `{ suggestTags: ["重点", "备选", "人才库"] }`, why: "给人才库候选人打上业务标签，下次开岗直接筛。" },
    { fn: "createContactMaskPlugin", cfg: `{ maskEmail: true, maskPhone: true }`, why: "复盘会上投影大屏，联系方式默认脱敏。" },
    { fn: "createExportPlugin", cfg: `{ filename: "talent-review" }`, why: "导出当前管道末态 CSV，直接贴进季度汇报。" },
    { fn: "createStatsPlugin", cfg: `{}`, why: "页脚漏斗 + 列头计数，各阶段存量一眼可读。" },
  ],
  props: [],
  note: "本场景是受控模式：onDataChange 回写宿主再喂回 Board，人才库计数 / 漏斗都反映最新数据。",
};

export default function TalentPool() {
  const [data, setData] = useState<Candidate[]>(SAMPLE_CANDIDATES);

  const Board = useMemo(
    () =>
      withPlugins(CandidateCore, [
        createArchivePoolPlugin(),
        createStarPlugin({ pinTop: true }),
        createTagPlugin({ suggestTags: ["重点", "备选", "人才库"] }),
        createContactMaskPlugin({ maskEmail: true, maskPhone: true }),
        createExportPlugin({ filename: "talent-review" }),
        createStatsPlugin(),
      ]),
    []
  );

  const handleChange = useCallback((next: Candidate[]) => setData(next), []);

  return <Board data={data} stages={SAMPLE_STAGES} containerStyle={{ minWidth: 1180 }} onDataChange={handleChange} />;
}
