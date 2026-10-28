import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createSocialLinksPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_LINKS } from "../data/sample";

/**
 * 07 · 社交外链 SocialLinks
 * 单装这一个插件：只渲染一排可点击的平台入口（图标字占位，无图片资源）。
 */
export const meta: DemoMeta = {
  slug: "social",
  title: "社交外链 SocialLinks",
  group: "plugin",
  plugin: "SocialLinks",
  intro: "一排可点击的平台入口（微博 / 知乎 / GitHub …），走领域槽 renderBioArea。",
  why: "主页底部的外链聚合；做成插件后入口列表完全数据驱动，Core 不掺任何平台样式。",
  plugs: [
    {
      fn: "createSocialLinksPlugin",
      cfg: "links: [...], showLabel: true, align: 'left'",
      why: "负责社交外链行渲染；常见平台有默认图标字与文案",
    },
  ],
  props: [],
  controls: [
    { key: "showLabel", label: "显示文案", kind: "switch", init: true },
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
  stageHeight: 200,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createSocialLinksPlugin({
          links: SAMPLE_LINKS,
          showLabel: Boolean(cfg.showLabel),
          align: cfg.align as "left" | "center" | "right",
        }),
      ]),
    [cfg.showLabel, cfg.align]
  );
  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} />;
}
