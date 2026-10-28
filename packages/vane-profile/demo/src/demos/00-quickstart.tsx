import React, { useMemo } from "react";
import { ProfileCore, withPlugins, useProfileContext } from "vane-profile";
import {
  createBannerSlotPlugin,
  createStatRowPlugin,
  createFollowEchoPlugin,
  createVerifyBadgePlugin,
  createTabSyncPlugin,
} from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { AVATAR, SAMPLE_USER } from "../data/sample";

/** 内容区：仅在有 TabSync 时显示，演示 children 兜底 */
function ProfileContent() {
  const ctx = useProfileContext();
  const tab = ctx?.activeTab ?? "works";
  return (
    <div style={{ minHeight: 120, fontSize: 14, lineHeight: 1.8, opacity: 0.8 }}>
      <b>{tab}</b> 页：Core 的 children 兜底内容。
    </div>
  );
}

/**
 * 00 · 最小可用主页（基础功能）
 * 5 行装配出一个能用的主页：头图 + 数据行 + 关注。再叠加认证 / 页签就是另一种观感。
 */
export const meta: DemoMeta = {
  slug: "quickstart",
  title: "最小可用主页",
  group: "basic",
  capability: "core-assembly",
  intro: "Core + 最少插件（BannerSlot + StatRow + FollowEcho）装配出可用主页。",
  why: "先跑通最小组合，再按需叠加插件——这正是插件式主页的增量开发方式。",
  plugs: [
    { fn: "createBannerSlotPlugin", cfg: "gradient: [...], avatar: user.avatar", why: "头图区" },
    { fn: "createStatRowPlugin", cfg: "items: user.stats", why: "数据行" },
    { fn: "createFollowEchoPlugin", cfg: "size: 'md'", why: "关注按钮" },
  ],
  props: ["stats={user.stats}", "followState={serverState}"],
  controls: [
    { key: "verified", label: "加认证徽标", kind: "switch", init: false },
    { key: "withTab", label: "加页签 + 内容区", kind: "switch", init: false },
  ],
  stageHeight: 320,
};

export default function Stage({ cfg }: DemoStageProps) {
  const verified = Boolean(cfg.verified);
  const withTab = Boolean(cfg.withTab);

  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createBannerSlotPlugin({
          gradient: ["#6a11cb", "#2575fc"],
          avatar: AVATAR,
          avatarRound: true,
          height: 150,
          overlay: <strong>{SAMPLE_USER.name}</strong>,
        }),
        createStatRowPlugin({ items: SAMPLE_USER.stats }),
        ...(withTab
          ? [createTabSyncPlugin({ tabs: [{ id: "works", label: "作品" }, { id: "about", label: "关于" }] })]
          : []),
        ...(verified ? [createVerifyBadgePlugin({ type: "personal" })] : []),
        createFollowEchoPlugin({ size: "md" }),
      ]),
    [verified, withTab]
  );

  return (
    <Profile
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
      stats={SAMPLE_USER.stats}
      verified={verified}
      badgeType="personal"
      followState="none"
      banner={<span>@{SAMPLE_USER.handle}</span>}
      defaultActiveTab={withTab ? "works" : undefined}
    >
      {withTab ? <ProfileContent /> : null}
    </Profile>
  );
}
