import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createBannerSlotPlugin, createMembershipBadgePlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { AVATAR, SAMPLE_USER } from "../data/sample";

/**
 * 12 · 会员角标 MembershipBadge
 * 单看这一个插件：浮于头图右上的 VIP 角标（与认证徽标同区并排）。
 */
export const meta: DemoMeta = {
  slug: "membership",
  title: "会员角标 MembershipBadge",
  group: "plugin",
  plugin: "MembershipBadge",
  intro: "会员 / VIP 等级角标，浮于头图右上，与认证徽标同区并排。",
  why: "付费会员 / 社区等级的可视标识；做成插件后头图右上多了一块身份区，Core 不碰配色。",
  plugs: [
    {
      fn: "createBannerSlotPlugin",
      cfg: "avatar: user.avatar, overlay: user.name",
      why: "提供头图背景，让角标落在它应有的右上角",
    },
    {
      fn: "createMembershipBadgePlugin",
      cfg: "level: {{level}}, showLabel: true",
      why: "负责会员角标渲染，与 VerifyBadge / QRShare 横向并排",
    },
  ],
  props: [],
  controls: [
    {
      key: "level",
      label: "等级",
      kind: "select",
      init: "3",
      options: [
        { label: "VIP1", value: "1" },
        { label: "VIP2", value: "2" },
        { label: "VIP3", value: "3" },
      ],
    },
  ],
  stageHeight: 220,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createBannerSlotPlugin({
          gradient: ["#6a11cb", "#1a5fd0"],
          avatar: AVATAR,
          overlay: SAMPLE_USER.name,
        }),
        createMembershipBadgePlugin({ level: Number(cfg.level) as 1 | 2 | 3 }),
      ]),
    [cfg.level]
  );
  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} />;
}
