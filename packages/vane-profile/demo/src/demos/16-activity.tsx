import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createActivitySummaryPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_ACTIVITY } from "../data/sample";

/**
 * 16 · 活跃度小结 ActivitySummary
 * 单看这一个插件：简介区里的一行轻量数据（最近活跃 / 本月发布 / 总阅读）。
 */
export const meta: DemoMeta = {
  slug: "activity",
  title: "活跃度小结 ActivitySummary",
  group: "plugin",
  plugin: "ActivitySummary",
  intro: "活跃度小结：最近活跃 / 本月发布 / 总阅读，一行小字。",
  why: "创作者活跃度 / 社区粘性提示；做成插件后简介区多了一块轻量数据，不抢主体。",
  plugs: [
    {
      fn: "createActivitySummaryPlugin",
      cfg: "lastActive: '2 小时前', postsThisMonth: 12, totalViews: '120w'",
      why: "负责活跃度小结渲染，排在简介区，与 BioSlot / SocialLinks 同区串联",
    },
  ],
  props: [],
  controls: [],
  stageHeight: 120,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () => withPlugins(ProfileCore, [createActivitySummaryPlugin(SAMPLE_ACTIVITY)]),
    []
  );
  return <Profile containerStyle={{ maxWidth: 460, margin: "0 auto" }} />;
}
