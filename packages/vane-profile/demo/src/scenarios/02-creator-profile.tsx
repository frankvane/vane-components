import React from "react";
import { ProfileCore, withPlugins, useProfileContext } from "vane-profile";
import {
  createBannerSlotPlugin,
  createStatRowPlugin,
  createTabSyncPlugin,
  createVerifyBadgePlugin,
  createBioSlotPlugin,
  createSocialLinksPlugin,
  createTagListPlugin,
  createWorksGridPlugin,
  createMembershipBadgePlugin,
  createLiveStatusPlugin,
  createContactCardPlugin,
  createMessageButtonPlugin,
  createAchievementWallPlugin,
} from "vane-profile/custom-plugins";
import type { ScenarioMeta } from "./types";
import {
  AVATAR,
  TAB_CONTENT,
  SAMPLE_LINKS,
  SAMPLE_TAGS,
  SAMPLE_WORKS,
  SAMPLE_MEMBERSHIP,
  SAMPLE_LIVE,
  SAMPLE_CONTACT,
  SAMPLE_ACHIEVEMENTS,
} from "../data/sample";

/** 内容区：订阅 activeTab */
function ProfileContent() {
  const ctx = useProfileContext();
  const tab = ctx?.activeTab ?? "posts";
  return (
    <div style={{ minHeight: 120, fontSize: 14, lineHeight: 1.85, color: "#cfd3c4" }}>
      <b style={{ color: "#e9ecdf", fontSize: 15 }}>{tab}</b>
      <p style={{ marginTop: 8 }}>{TAB_CONTENT[tab] ?? "（空）"}</p>
    </div>
  );
}

/**
 * 02 · 创作者主页（对标小红书 / B 站 UP 主页）
 *
 * 变体：机构认证 + 分段页签 + 简介/社交/标签/作品网格。
 * 演示同一套插件换配置就是另一种主页观感。
 */
export const meta: ScenarioMeta = {
  id: "creator-profile",
  title: "创作者主页",
  group: "创作者",
  ref: { label: "小红书", url: "https://www.xiaohongshu.com/" },
  pain: "创作者要机构认证 + 分段页签 + 自己的主页不显示关注按钮 + 作品墙",
  plugs: [
    { fn: "createBannerSlotPlugin", cfg: "gradient: ['#11998e','#38ef7d'], avatar: user.avatar", why: "薄荷渐变头图，区分品牌调性" },
    { fn: "createBioSlotPlugin", cfg: "name, bio, location", why: "简介区：昵称/签名/地点" },
    { fn: "createStatRowPlugin", cfg: "items: user.stats, direction: 'row'", why: "数据行展示粉丝/获赞/收藏" },
    { fn: "createSocialLinksPlugin", cfg: "links: [...]", why: "社交外链引流" },
    { fn: "createTagListPlugin", cfg: "tags: [...]", why: "内容领域标签" },
    { fn: "createLiveStatusPlugin", cfg: "status: 'live'", why: "直播中状态（简介区）" },
    { fn: "createContactCardPlugin", cfg: "email, site, address", why: "商务联系入口（简介区）" },
    { fn: "createTabSyncPlugin", cfg: "tabs: [...], variant: 'segmented'", why: "分段式页签，更紧凑" },
    { fn: "createVerifyBadgePlugin", cfg: "type: 'institution'", why: "机构认证，区别于个人" },
    { fn: "createMembershipBadgePlugin", cfg: "level: 3", why: "会员角标（徽标区）" },
    { fn: "createMessageButtonPlugin", cfg: "label: '私信'", why: "私信按钮（关注区位，自己主页也可见）" },
    { fn: "createWorksGridPlugin", cfg: "items: user.works, tab: 'posts'", why: "作品网格，随页签联动" },
    { fn: "createAchievementWallPlugin", cfg: "items: user.badges, tab: 'goods'", why: "荣誉墙（内容区，挂在「好物」页签）" },
  ],
  props: ["verified", 'badgeType="institution"', "stats={user.stats}"],
  note: "不装 FollowEcho → 自己的主页不显示关注按钮；同一套插件换配置即得另一种观感。会员角标、私信、成就墙等新增插件即插即用。",
  tone: "dark",
};

const TABS = [
  { id: "posts", label: "笔记" },
  { id: "videos", label: "视频" },
  { id: "goods", label: "好物" },
];

const STATS = [
  { value: "86.2w", label: "粉丝" },
  { value: 3120, label: "获赞" },
  { value: 458, label: "收藏" },
];

const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({
    gradient: ["#11998e", "#38ef7d"],
    avatar: AVATAR,
    avatarRound: true,
    height: 140,
    overlay: <strong>Studio Vane</strong>,
  }),
  createBioSlotPlugin({
    name: "Studio Vane",
    subtitle: "设计系统团队",
    bio: "每周分享组件库与可视化实战。",
    location: "杭州",
  }),
  createStatRowPlugin({ items: STATS }),
  createSocialLinksPlugin({ links: SAMPLE_LINKS }),
  createTagListPlugin({ tags: SAMPLE_TAGS }),
  createLiveStatusPlugin(SAMPLE_LIVE),
  createContactCardPlugin(SAMPLE_CONTACT),
  createTabSyncPlugin({ tabs: TABS, variant: "segmented" }),
  createVerifyBadgePlugin({ type: "institution" }),
  createMembershipBadgePlugin(SAMPLE_MEMBERSHIP),
  createMessageButtonPlugin({ label: "私信" }),
  createWorksGridPlugin({ items: SAMPLE_WORKS, columns: 3, title: "最新作品", tab: "posts" }),
  createAchievementWallPlugin({ items: SAMPLE_ACHIEVEMENTS, columns: 4, title: "荣誉墙", tab: "goods" }),
]);

export default function CreatorProfileScenario() {
  return (
    <Profile
      containerStyle={{ maxWidth: 460, margin: "0 auto" }}
      stats={STATS}
      verified
      badgeType="institution"
      banner={<span>@studio-vane</span>}
      defaultActiveTab="posts"
    >
      <ProfileContent />
    </Profile>
  );
}
