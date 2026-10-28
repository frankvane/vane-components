import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createBannerSlotPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { AVATAR, SAMPLE_USER } from "../data/sample";

const GRADIENTS: Record<string, [string, string]> = {
  violet: ["#6a11cb", "#2575fc"],
  sunset: ["#ff7e5f", "#feb47b"],
  mint: ["#11998e", "#38ef7d"],
  ink: ["#232526", "#414345"],
};

/**
 * 01 · 头图区 BannerSlot
 * 单装这一个插件：只渲染头图区，演示「领域槽」如何把头图封装成可替换的视觉块。
 */
export const meta: DemoMeta = {
  slug: "banner",
  title: "头图区 BannerSlot",
  group: "plugin",
  plugin: "BannerSlot",
  intro: "封面渐变 + 头像浮层 + 昵称标语叠加，走领域槽 renderBannerArea。",
  why: "主页第一眼就是头图；把它做成插件，封面/头像/文案都能独立替换，Core 永远不碰样式。",
  plugs: [
    {
      fn: "createBannerSlotPlugin",
      cfg: "gradient: ['#6a11cb','#2575fc'], avatar: user.avatar, height: 160, overlay: <strong>{user.name}</strong>",
      why: "负责头图区渲染：渐变/封面背景 + 头像浮层 + 文案叠加",
    },
  ],
  props: ["banner={<span>@{user.handle}</span>}"],
  controls: [
    {
      key: "gradient",
      label: "渐变配色",
      kind: "select",
      init: "violet",
      options: [
        { label: "紫蓝 violet", value: "violet" },
        { label: "暖阳 sunset", value: "sunset" },
        { label: "薄荷 mint", value: "mint" },
        { label: "墨灰 ink", value: "ink" },
      ],
    },
    { key: "avatar", label: "显示头像", kind: "switch", init: true },
    { key: "round", label: "圆角头像", kind: "switch", init: true },
    { key: "height", label: "头图高度", kind: "number", init: 160, min: 110, max: 240, step: 10 },
  ],
  stageHeight: 320,
};

export default function Stage({ cfg }: DemoStageProps) {
  const gradientKey = String(cfg.gradient);
  const gradient = GRADIENTS[gradientKey] ?? GRADIENTS.violet;

  // 用 useMemo 固定组件类型，避免拖控件时整块重挂载
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createBannerSlotPlugin({
          gradient,
          avatar: cfg.avatar ? AVATAR : undefined,
          avatarRound: Boolean(cfg.round),
          height: Number(cfg.height),
          overlay: <strong>{SAMPLE_USER.name}</strong>,
        }),
      ]),
    [gradient, cfg.avatar, cfg.round, cfg.height]
  );

  return (
    <Profile
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
      banner={<span>@{SAMPLE_USER.handle}</span>}
    />
  );
}
