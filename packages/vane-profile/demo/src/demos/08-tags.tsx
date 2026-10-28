import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createTagListPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_TAGS } from "../data/sample";

/**
 * 08 · 兴趣标签 TagList
 * 单装这一个插件：只渲染一排圆角小标签。
 */
export const meta: DemoMeta = {
  slug: "tags",
  title: "兴趣标签 TagList",
  group: "plugin",
  plugin: "TagList",
  intro: "一排圆角小标签，走领域槽 renderBioArea。",
  why: "兴趣 / 内容领域标记；做成插件后标签完全数据驱动，Core 不掺样式。",
  plugs: [
    {
      fn: "createTagListPlugin",
      cfg: "tags: ['React','TypeScript','组件库', …]",
      why: "负责标签行渲染；tags 为空时整体不渲染",
    },
  ],
  props: [],
  controls: [
    {
      key: "align",
      label: "对齐",
      kind: "select",
      init: "left",
      options: [
        { label: "左 left", value: "left" },
        { label: "中 center", value: "center" },
        { label: "右 right", value: "right" },
      ],
    },
  ],
  stageHeight: 160,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createTagListPlugin({
          tags: SAMPLE_TAGS,
          align: cfg.align as "left" | "center" | "right",
        }),
      ]),
    [cfg.align]
  );
  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} />;
}
