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
} from "vane-profile/custom-plugins";
import type { ScenarioMeta } from "./types";
import {
  AVATAR,
  TAB_CONTENT,
  SAMPLE_LINKS,
  SAMPLE_TAGS,
  SAMPLE_WORKS,
} from "../data/sample";

function ProfileContent() {
  const ctx = useProfileContext();
  const tab = ctx?.activeTab ?? "home";
  return (
    <div style={{ minHeight: 120, fontSize: 14, lineHeight: 1.85, color: "#cfd3c4" }}>
      <b style={{ color: "#e9ecdf", fontSize: 15 }}>{tab}</b>
      <p style={{ marginTop: 8 }}>{TAB_CONTENT[tab] ?? "（空）"}</p>
    </div>
  );
}

/**
 * 03 · 企业号主页（对标品牌官号 / 机构蓝 V）
 *
 * 与「个人主页」同套插件，差异在配置：机构认证 + 企业简介 + 官网/客服外链 +
 * 业务标签 + 关注按钮（品牌号需要涨粉）。演示领域插件如何零改动撑起不同业务。
 */
export const meta: ScenarioMeta = {
  id: "brand-page",
  title: "企业号主页",
  group: "企业号",
  ref: { label: "品牌官号", url: "https://weibo.com/" },
  pain: "机构要蓝 V、企业简介、官网/客服入口、业务标签，还要保留关注按钮涨粉",
  plugs: [
    { fn: "createBannerSlotPlugin", cfg: "gradient: ['#0f2027','#2c5364'], avatar: logo", why: "深色品牌头图 + Logo 浮层" },
    { fn: "createVerifyBadgePlugin", cfg: "type: 'institution'", why: "机构蓝 V 认证" },
    { fn: "createBioSlotPlugin", cfg: "name, subtitle, bio", why: "企业简介 + Slogan" },
    { fn: "createStatRowPlugin", cfg: "items: brand.stats", why: "粉丝/内容/员工等经营指标" },
    { fn: "createSocialLinksPlugin", cfg: "links: [官网, 客服, 招聘]", why: "官网/客服/招聘入口" },
    { fn: "createTagListPlugin", cfg: "tags: [业务领域]", why: "业务标签" },
    { fn: "createTabSyncPlugin", cfg: "tabs: [主页, 动态, 招聘]", why: "页签切换" },
    { fn: "createFollowEchoPlugin", cfg: "size: 'md'", why: "关注按钮（品牌号涨粉）" },
    { fn: "createWorksGridPlugin", cfg: "items: brand.works, tab: 'home'", why: "主页作品/案例网格" },
  ],
  props: ["verified", 'badgeType="institution"', "followState={serverState}", "stats={brand.stats}"],
  note: "与个人主页是同一套 16 个插件，仅配置不同 —— 领域插件零改动即可撑起不同业务。",
  tone: "dark",
};

const TABS = [
  { id: "home", label: "主页" },
  { id: "feeds", label: "动态" },
  { id: "jobs", label: "招聘" },
];

const BRAND_STATS = [
  { value: "120.5w", label: "粉丝" },
  { value: 842, label: "内容" },
  { value: 36, label: "在招岗位" },
];

const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({
    gradient: ["#0f2027", "#2c5364"],
    avatar: AVATAR,
    avatarRound: false,
    height: 150,
    overlay: <strong>Vane 设计系统</strong>,
  }),
  createVerifyBadgePlugin({ type: "institution" }),
  createBioSlotPlugin({
    name: "Vane 设计系统",
    subtitle: "企业级组件与规范",
    bio: "让每一次界面搭建都从一套一致的零件开始。",
    location: "远程 · 全球",
  }),
  createStatRowPlugin({ items: BRAND_STATS }),
  createSocialLinksPlugin({
    links: [
      { platform: "site", href: "https://vane.dev/" },
      { platform: "email", href: "mailto:hello@vane.dev" },
      { platform: "github", href: "https://github.com/" },
    ],
  }),
  createTagListPlugin({ tags: ["设计系统", "组件库", "Design Token", "无障碍", "招聘中"] }),
  createTabSyncPlugin({ tabs: TABS }),
  createFollowEchoPlugin({ size: "md" }),
  createWorksGridPlugin({ items: SAMPLE_WORKS, columns: 3, title: "精选案例", tab: "home" }),
]);

export default function BrandPageScenario() {
  return (
    <Profile
      containerStyle={{ maxWidth: 460, margin: "0 auto" }}
      stats={BRAND_STATS}
      verified
      badgeType="institution"
      followState="none"
      banner={<span>@vane-design</span>}
      defaultActiveTab="home"
    >
      <ProfileContent />
    </Profile>
  );
}
