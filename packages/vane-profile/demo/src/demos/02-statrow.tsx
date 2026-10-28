import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createStatRowPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_USER } from "../data/sample";

/**
 * 02 · 数据行 StatRow
 * 只装 StatRow：横排关注/粉丝/获赞/作品。演示数据从 config.items 注入。
 */
export const meta: DemoMeta = {
  slug: "statrow",
  title: "数据行 StatRow",
  group: "plugin",
  plugin: "StatRow",
  intro: "关注 / 粉丝 / 获赞 / 作品横排展示，每项「值 + 标签」。",
  why: "指标展示是主页标配；做成插件后 row/column、分隔线、点击联动都由配置决定，Core 不掺样式。",
  plugs: [
    {
      fn: "createStatRowPlugin",
      cfg: "items: user.stats, direction: 'row', divider: true",
      why: "负责数据行渲染，数据源来自 config.items 或 props.stats",
    },
  ],
  props: ["stats={user.stats}"],
  controls: [
    {
      key: "direction",
      label: "排布方向",
      kind: "select",
      init: "row",
      options: [
        { label: "横排 row", value: "row" },
        { label: "竖排 column", value: "column" },
      ],
    },
    { key: "divider", label: "项间分隔线", kind: "switch", init: true },
  ],
  stageHeight: 260,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createStatRowPlugin({
          items: SAMPLE_USER.stats,
          direction: cfg.direction === "column" ? "column" : "row",
          divider: Boolean(cfg.divider),
        }),
      ]),
    [cfg.direction, cfg.divider]
  );

  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} stats={SAMPLE_USER.stats} />;
}
