import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createAchievementWallPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_ACHIEVEMENTS } from "../data/sample";

/**
 * 18 · 成就墙 AchievementWall
 * 单看这一个插件：内容区的成就 / 勋章网格（随 activeTab 联动）。
 */
export const meta: DemoMeta = {
  slug: "achievements",
  title: "成就墙 AchievementWall",
  group: "plugin",
  plugin: "AchievementWall",
  intro: "成就 / 勋章墙：随 activeTab 联动的内容区插件。",
  why: "个人主页荣誉展示；做成内容区插件后，切到对应页签才出墙，与 WorksGrid 同区可共存。",
  plugs: [
    {
      fn: "createAchievementWallPlugin",
      cfg: "items: user.badges, columns: 4, title: '成就'",
      why: "负责成就墙渲染，走 renderContentArea，有它时接管 children",
    },
  ],
  props: [],
  controls: [
    {
      key: "columns",
      label: "列数",
      kind: "number",
      init: 4,
      min: 2,
      max: 8,
      step: 1,
    },
  ],
  stageHeight: 240,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createAchievementWallPlugin({
          items: SAMPLE_ACHIEVEMENTS,
          columns: Number(cfg.columns),
          title: "成就",
        }),
      ]),
    [cfg.columns]
  );
  return <Profile containerStyle={{ maxWidth: 480, margin: "0 auto" }} />;
}
