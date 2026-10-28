import React from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import {
  createBannerSlotPlugin,
  createStatRowPlugin,
  createFollowEchoPlugin,
} from "vane-profile/custom-plugins";
import type { ScenarioMeta } from "./types";
import { AVATAR, SAMPLE_USER } from "../data/sample";

/**
 * 04 · 极简主页（对标纯展示型个人页）
 *
 * 只要头图 + 数据行 + 关注三件套：不装页签、不装简介、不装作品网格。
 * 演示「插件式主页」的减法 —— 不需要的能力完全不付代价。
 */
export const meta: ScenarioMeta = {
  id: "minimal-profile",
  title: "极简主页",
  group: "极简",
  ref: { label: "极简", url: "https://vane.dev/" },
  pain: "只想有个头图 + 关注按钮，不要页签/作品/简介这些花哨的",
  plugs: [
    { fn: "createBannerSlotPlugin", cfg: "gradient: ['#834d9b','#d04ed6'], avatar: user.avatar", why: "头图区" },
    { fn: "createStatRowPlugin", cfg: "items: user.stats", why: "数据行" },
    { fn: "createFollowEchoPlugin", cfg: "size: 'sm'", why: "关注按钮" },
  ],
  props: ["stats={user.stats}", "followState={serverState}"],
  note: "只装 3 个插件：没有页签就没有内容区，没有简介区就直接从头图跳到数据行。",
  tone: "dark",
};

const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({
    gradient: ["#834d9b", "#d04ed6"],
    avatar: AVATAR,
    avatarRound: true,
    height: 130,
    overlay: <strong>{SAMPLE_USER.name}</strong>,
  }),
  createStatRowPlugin({ items: SAMPLE_USER.stats }),
  createFollowEchoPlugin({ size: "sm" }),
]);

export default function MinimalProfileScenario() {
  return (
    <Profile
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
      stats={SAMPLE_USER.stats}
      followState="none"
      banner={<span>@{SAMPLE_USER.handle}</span>}
    />
  );
}
