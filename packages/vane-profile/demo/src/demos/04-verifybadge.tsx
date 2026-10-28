import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createVerifyBadgePlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";

/**
 * 04 · 认证徽标 VerifyBadge
 * 只装 VerifyBadge：个人/机构两种对勾浮于头图右上角。verified=false 自动隐藏。
 */
export const meta: DemoMeta = {
  slug: "verifybadge",
  title: "认证徽标 VerifyBadge",
  group: "plugin",
  plugin: "VerifyBadge",
  intro: "个人 / 机构认证对勾（内联 SVG），浮于头图右上角。",
  why: "信任标识是主页的「小但重要」需求；做成插件，认证态/类型都可配置，不污染 Core。",
  plugs: [
    {
      fn: "createVerifyBadgePlugin",
      cfg: "type: 'personal', showLabel: true",
      why: "负责认证徽标渲染，verified=false 时自动隐藏",
    },
  ],
  props: ["verified", "badgeType=\"personal\""],
  controls: [
    { key: "verified", label: "已认证", kind: "switch", init: true },
    {
      key: "type",
      label: "认证类型",
      kind: "select",
      init: "personal",
      options: [
        { label: "个人 personal", value: "personal" },
        { label: "机构 institution", value: "institution" },
      ],
    },
    { key: "showLabel", label: "显示文字", kind: "switch", init: true },
  ],
  stageHeight: 200,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createVerifyBadgePlugin({
          type: cfg.type as "personal" | "institution",
          showLabel: Boolean(cfg.showLabel),
        }),
      ]),
    [cfg.type, cfg.showLabel]
  );

  return (
    <Profile
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
      verified={Boolean(cfg.verified)}
      badgeType={cfg.type as "personal" | "institution"}
    />
  );
}
