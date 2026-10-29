import React, { useMemo } from "react";
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
import type { ProfilePlugin } from "vane-profile";
import type { DemoMeta, DemoStageProps } from "./types";
import {
  AVATAR,
  SAMPLE_USER,
  SAMPLE_LINKS,
  SAMPLE_TAGS,
  SAMPLE_WORKS,
  SAMPLE_MEMBERSHIP,
  SAMPLE_LIVE,
  SAMPLE_CONTACT,
  SAMPLE_ACTIVITY,
  SAMPLE_ACHIEVEMENTS,
} from "../data/sample";

const TABS = [
  { id: "works", label: "作品" },
  { id: "feeds", label: "动态" },
  { id: "about", label: "关于" },
];

/** 内容兜底：非作品页签时显示文本（演示 children 兜底） */
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
 * 10 · 全功能组合（高级功能）
 * 16 个插件全部可开关，实时看装配代码怎么写。这正是「插件式主页」的增量拼装方式。
 */
export const meta: DemoMeta = {
  slug: "full-combo",
  title: "全功能组合",
  group: "advanced",
  capability: "all-plugins",
  intro: "16 个官方插件逐个开关，实时生成对应装配代码。",
  why: "把分散的插件页串起来：一个主页就是「挑插件 + 写配置」，没有一行样式散落在业务里。",
  plugs: [
    { fn: "createBannerSlotPlugin", cfg: "gradient: [...], avatar: user.avatar", why: "头图区" },
    { fn: "createBioSlotPlugin", cfg: "name, bio, location, joinDate", why: "简介区" },
    { fn: "createStatRowPlugin", cfg: "items: user.stats", why: "数据行" },
    { fn: "createSocialLinksPlugin", cfg: "links: [...]", why: "社交外链" },
    { fn: "createTagListPlugin", cfg: "tags: [...]", why: "兴趣标签" },
    { fn: "createTabSyncPlugin", cfg: "tabs: [...]", why: "页签栏 + 内容联动" },
    { fn: "createVerifyBadgePlugin", cfg: "type: 'personal'", why: "认证徽标" },
    { fn: "createFollowEchoPlugin", cfg: "size: 'md'", why: "关注按钮" },
    { fn: "createWorksGridPlugin", cfg: "items: user.works, tab: 'works'", why: "作品网格（内容区）" },
    { fn: "createMembershipBadgePlugin", cfg: "level: 3", why: "会员角标（徽标区）" },
    { fn: "createQRSharePlugin", cfg: "url: user.homeUrl", why: "二维码分享（徽标区）" },
    { fn: "createLiveStatusPlugin", cfg: "status: 'live'", why: "在线/直播状态（简介区）" },
    { fn: "createContactCardPlugin", cfg: "email, site, address", why: "联系信息（简介区）" },
    { fn: "createActivitySummaryPlugin", cfg: "lastActive, postsThisMonth", why: "活跃度小结（简介区）" },
    { fn: "createMessageButtonPlugin", cfg: "label: '私信'", why: "私信按钮（关注区）" },
    { fn: "createAchievementWallPlugin", cfg: "items: user.badges, tab: 'about'", why: "成就墙（内容区）" },
  ],
  props: ["verified", "stats={user.stats}", "followState={serverState}"],
  controls: [
    { key: "banner", label: "BannerSlot", kind: "switch", init: true },
    { key: "bio", label: "BioSlot", kind: "switch", init: true },
    { key: "stat", label: "StatRow", kind: "switch", init: true },
    { key: "social", label: "SocialLinks", kind: "switch", init: true },
    { key: "tags", label: "TagList", kind: "switch", init: true },
    { key: "tab", label: "TabSync", kind: "switch", init: true },
    { key: "badge", label: "VerifyBadge", kind: "switch", init: true },
    { key: "follow", label: "FollowEcho", kind: "switch", init: true },
    { key: "works", label: "WorksGrid", kind: "switch", init: true },
    { key: "membership", label: "MembershipBadge", kind: "switch", init: true },
    { key: "qrshare", label: "QRShare", kind: "switch", init: true },
    { key: "live", label: "LiveStatus", kind: "switch", init: true },
    { key: "contact", label: "ContactCard", kind: "switch", init: true },
    { key: "activity", label: "ActivitySummary", kind: "switch", init: true },
    { key: "message", label: "MessageButton", kind: "switch", init: true },
    { key: "achievements", label: "AchievementWall", kind: "switch", init: true },
  ],
  stageHeight: 560,
};

export default function Stage({ cfg }: DemoStageProps) {
  const withTab = Boolean(cfg.tab);

  const Profile = useMemo(() => {
    const plugs: ProfilePlugin<unknown>[] = [];
    if (cfg.banner)
      plugs.push(
        createBannerSlotPlugin({
          gradient: ["#6a11cb", "#1a5fd0"],
          avatar: AVATAR,
          avatarRound: true,
          height: 150,
          overlay: <strong>{SAMPLE_USER.name}</strong>,
        })
      );
    if (cfg.bio)
      plugs.push(
        createBioSlotPlugin({
          name: SAMPLE_USER.name,
          subtitle: "前端工程师 · 组件库作者",
          bio: SAMPLE_USER.bio,
          location: "上海",
          joinDate: "2021 加入",
        })
      );
    if (cfg.stat) plugs.push(createStatRowPlugin({ items: SAMPLE_USER.stats }));
    if (cfg.social) plugs.push(createSocialLinksPlugin({ links: SAMPLE_LINKS }));
    if (cfg.tags) plugs.push(createTagListPlugin({ tags: SAMPLE_TAGS }));
    if (withTab) plugs.push(createTabSyncPlugin({ tabs: TABS }));
    if (cfg.badge) plugs.push(createVerifyBadgePlugin({ type: "personal" }));
    if (cfg.follow) plugs.push(createFollowEchoPlugin({ size: "md" }));
    if (cfg.works)
      plugs.push(
        createWorksGridPlugin({
          items: SAMPLE_WORKS,
          columns: 3,
          title: "精选作品",
          tab: withTab ? "works" : undefined,
        })
      );
    if (cfg.membership) plugs.push(createMembershipBadgePlugin(SAMPLE_MEMBERSHIP));
    if (cfg.qrshare) plugs.push(createQRSharePlugin({ url: "https://vane.dev/u/frankvane" }));
    if (cfg.live) plugs.push(createLiveStatusPlugin(SAMPLE_LIVE));
    if (cfg.contact) plugs.push(createContactCardPlugin(SAMPLE_CONTACT));
    if (cfg.activity) plugs.push(createActivitySummaryPlugin(SAMPLE_ACTIVITY));
    if (cfg.message) plugs.push(createMessageButtonPlugin({ label: "私信" }));
    if (cfg.achievements)
      plugs.push(
        createAchievementWallPlugin({
          items: SAMPLE_ACHIEVEMENTS,
          columns: 4,
          title: "成就",
          tab: withTab ? "about" : undefined,
        })
      );
    return withPlugins(ProfileCore, plugs);
  }, [
    cfg.banner, cfg.bio, cfg.stat, cfg.social, cfg.tags, withTab, cfg.badge,
    cfg.follow, cfg.works, cfg.membership, cfg.qrshare, cfg.live, cfg.contact,
    cfg.activity, cfg.message, cfg.achievements,
  ]);

  return (
    <Profile
      containerStyle={{ maxWidth: 460, margin: "0 auto" }}
      stats={SAMPLE_USER.stats}
      verified={Boolean(cfg.badge)}
      badgeType="personal"
      followState="none"
      banner={<span>@{SAMPLE_USER.handle}</span>}
      defaultActiveTab={withTab ? "works" : undefined}
    >
      {withTab ? <ProfileContent /> : null}
    </Profile>
  );
}
