import React from "react";
import { ProfileCore, withPlugins, useProfileContext } from "vane-profile";
import {
  createBannerSlotPlugin,
  createStatRowPlugin,
  createTabSyncPlugin,
  createVerifyBadgePlugin,
  createFollowEchoPlugin,
  createBioSlotPlugin,
  createSocialLinksPlugin,
  createTagListPlugin,
  createWorksGridPlugin,
  createMembershipBadgePlugin,
  createQRSharePlugin,
  createLiveStatusPlugin,
  createContactCardPlugin,
  createActivitySummaryPlugin,
  createMessageButtonPlugin,
  createAchievementWallPlugin,
} from "vane-profile/custom-plugins";
import type { ScenarioMeta } from "./types";
import {
  AVATAR,
  SAMPLE_USER,
  TAB_CONTENT,
  SAMPLE_LINKS,
  SAMPLE_TAGS,
  SAMPLE_WORKS,
  SAMPLE_MEMBERSHIP,
  SAMPLE_LIVE,
  SAMPLE_CONTACT,
  SAMPLE_ACTIVITY,
  SAMPLE_ACHIEVEMENTS,
} from "../data/sample";

/** 内容区：订阅 activeTab，随页签切换重渲染（WorksGrid 接管 works 页，其余页走 children 兜底） */
function ProfileContent() {
  const ctx = useProfileContext();
  const tab = ctx?.activeTab ?? "works";
  return (
    <div style={{ minHeight: 120, fontSize: 14, lineHeight: 1.85, color: "#cfd3c4" }}>
      <b style={{ color: "#e9ecdf", fontSize: 15 }}>{tab}</b>
      <p style={{ marginTop: 8 }}>{TAB_CONTENT[tab] ?? "（空）"}</p>
    </div>
  );
}

/**
 * 01 · 全功能个人主页（对标微博 / 即刻个人页）
 *
 * 16 个官方插件按 priority 串联：头图区 / 简介区（昵称·社交·标签·直播·联系·活跃）/
 * 数据行 / 页签栏 / 徽标区（认证·会员·分享）/ 关注区（关注·私信）/ 内容区（作品·成就）。
 * Core 只负责三段式布局与生命周期转发。
 */
export const meta: ScenarioMeta = {
  id: "profile-combo",
  title: "全功能个人主页",
  group: "社交主页",
  ref: { label: "微博", url: "https://weibo.com/" },
  pain: "头图、简介、数据行、社交、标签、页签、认证、关注、作品要一起出现，还互不打架",
  plugs: [
    { fn: "createBannerSlotPlugin", cfg: "gradient: ['#6a11cb','#1a5fd0'], avatar: user.avatar", why: "头图区：渐变 + 头像浮层 + 昵称" },
    { fn: "createBioSlotPlugin", cfg: "name, bio, location, joinDate", why: "简介区：昵称/签名/地点/时间" },
    { fn: "createStatRowPlugin", cfg: "items: user.stats", why: "数据行：关注/粉丝/获赞/作品" },
    { fn: "createSocialLinksPlugin", cfg: "links: [...]", why: "社交外链行" },
    { fn: "createTagListPlugin", cfg: "tags: [...]", why: "兴趣标签" },
    { fn: "createTabSyncPlugin", cfg: "tabs: [...]", why: "页签栏 + 切换联动内容区（交互中枢）" },
    { fn: "createVerifyBadgePlugin", cfg: "type: 'personal'", why: "认证徽标浮于头图右上角" },
    { fn: "createFollowEchoPlugin", cfg: "size: 'md'", why: "关注按钮，受控于 props.followState" },
    { fn: "createWorksGridPlugin", cfg: "items: user.works, tab: 'works'", why: "作品网格，内容区随页签联动" },
    { fn: "createMembershipBadgePlugin", cfg: "level: 3", why: "会员角标（徽标区）" },
    { fn: "createQRSharePlugin", cfg: "url: user.homeUrl", why: "二维码分享（徽标区）" },
    { fn: "createLiveStatusPlugin", cfg: "status: 'live'", why: "在线/直播状态（简介区）" },
    { fn: "createContactCardPlugin", cfg: "email, site, address", why: "联系信息（简介区）" },
    { fn: "createActivitySummaryPlugin", cfg: "lastActive, postsThisMonth", why: "活跃度小结（简介区）" },
    { fn: "createMessageButtonPlugin", cfg: "label: '私信'", why: "私信按钮（关注区）" },
    { fn: "createAchievementWallPlugin", cfg: "items: user.badges, tab: 'about'", why: "成就墙（内容区，挂在「关于」页签）" },
  ],
  props: [
    "verified",
    'badgeType="personal"',
    "followState={serverState}",
    "stats={user.stats}",
    "banner={<span>@{user.handle}</span>}",
  ],
  note: "TabSync 是唯一带交互的插件；其余都是「渲染槽」，按 priority 串联，互不覆盖。作品网格与成就墙都走 renderContentArea，分别挂在「作品」「关于」页签下随页签联动。",
  tone: "dark",
};

const TABS = [
  { id: "works", label: "作品" },
  { id: "feeds", label: "动态" },
  { id: "about", label: "关于" },
];

const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({
    gradient: ["#6a11cb", "#1a5fd0"],
    avatar: AVATAR,
    avatarRound: true,
    height: 150,
    overlay: <strong>{SAMPLE_USER.name}</strong>,
  }),
  createBioSlotPlugin({
    name: SAMPLE_USER.name,
    subtitle: "前端工程师 · 组件库作者",
    bio: SAMPLE_USER.bio,
    location: "上海",
    joinDate: "2021 加入",
  }),
  createStatRowPlugin({ items: SAMPLE_USER.stats }),
  createSocialLinksPlugin({ links: SAMPLE_LINKS }),
  createTagListPlugin({ tags: SAMPLE_TAGS }),
  createLiveStatusPlugin(SAMPLE_LIVE),
  createContactCardPlugin(SAMPLE_CONTACT),
  createActivitySummaryPlugin(SAMPLE_ACTIVITY),
  createTabSyncPlugin({ tabs: TABS }),
  createVerifyBadgePlugin({ type: "personal" }),
  createMembershipBadgePlugin(SAMPLE_MEMBERSHIP),
  createQRSharePlugin({ url: "https://vane.dev/u/frankvane" }),
  createFollowEchoPlugin({ size: "md" }),
  createMessageButtonPlugin({ label: "私信" }),
  createWorksGridPlugin({ items: SAMPLE_WORKS, columns: 3, title: "精选作品", tab: "works" }),
  createAchievementWallPlugin({ items: SAMPLE_ACHIEVEMENTS, columns: 4, title: "成就", tab: "about" }),
]);

export default function ProfileComboScenario() {
  return (
    <Profile
      containerStyle={{ maxWidth: 460, margin: "0 auto" }}
      stats={SAMPLE_USER.stats}
      verified
      badgeType="personal"
      followState="none"
      banner={<span>@{SAMPLE_USER.handle}</span>}
      defaultActiveTab="works"
    >
      <ProfileContent />
    </Profile>
  );
}
