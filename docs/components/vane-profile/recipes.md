# 个人主页引擎 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对 16 个插件不知道选谁」的成本。下面 4 个配方对应演示站「场景库」的 4 种版式，可直接复制使用。

```tsx
import { ProfileCore, withPlugins } from "vane-profile";
import { createBannerSlotPlugin } from "vane-profile/custom-plugins/BannerSlotPlugin";
import { createBioSlotPlugin } from "vane-profile/custom-plugins/BioSlotPlugin";
import { createStatRowPlugin } from "vane-profile/custom-plugins/StatRowPlugin";
import { createSocialLinksPlugin } from "vane-profile/custom-plugins/SocialLinksPlugin";
import { createTagListPlugin } from "vane-profile/custom-plugins/TagListPlugin";
import { createTabSyncPlugin } from "vane-profile/custom-plugins/TabSyncPlugin";
import { createVerifyBadgePlugin } from "vane-profile/custom-plugins/VerifyBadgePlugin";
import { createFollowEchoPlugin } from "vane-profile/custom-plugins/FollowEchoPlugin";
import { createWorksGridPlugin } from "vane-profile/custom-plugins/WorksGridPlugin";
import { createMembershipBadgePlugin } from "vane-profile/custom-plugins/MembershipBadgePlugin";
import { createQRSharePlugin } from "vane-profile/custom-plugins/QRSharePlugin";
import { createLiveStatusPlugin } from "vane-profile/custom-plugins/LiveStatusPlugin";
import { createContactCardPlugin } from "vane-profile/custom-plugins/ContactCardPlugin";
import { createMessageButtonPlugin } from "vane-profile/custom-plugins/MessageButtonPlugin";
import { createAchievementWallPlugin } from "vane-profile/custom-plugins/AchievementWallPlugin";
```

## 1. 最简主页（Basic）

只要头图 + 数据行 + 页签 + 认证 + 关注，最常用的五件。

```tsx
export const BasicProfile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ gradient: ["#6a11cb", "#2575fc"], avatar: user.avatar, overlay: user.name }),
  createStatRowPlugin({ items: user.stats }),
  createTabSyncPlugin({ tabs: [
    { id: "posts", label: "作品" },
    { id: "about", label: "关于" },
  ] }),
  createVerifyBadgePlugin({ type: "personal" }),
  createFollowEchoPlugin({ onFollow: toggleFollow }),
]);
```

## 2. 创作者主页（Creator）

在最简版基础上，用 `renderBioArea` 三件套（BioSlot / SocialLinks / TagList）铺满简介区，并用 `WorksGrid` 接管内容区随页签联动。

```tsx
export const CreatorProfile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ cover: user.cover, avatar: user.avatar, overlay: user.name }),
  createBioSlotPlugin({ subtitle: user.role, bio: user.bio, location: user.city, joinDate: "2021 加入" }),
  createSocialLinksPlugin({ links: user.links }),
  createTagListPlugin({ tags: user.interests }),
  createLiveStatusPlugin({ status: "live", liveTitle: user.liveTitle }),
  createContactCardPlugin({ email: user.email, site: user.site }),
  createStatRowPlugin({ items: user.stats }),
  createTabSyncPlugin({ tabs: [
    { id: "works", label: "作品" },
    { id: "feeds", label: "动态" },
    { id: "about", label: "关于" },
  ] }),
  createVerifyBadgePlugin({ type: "personal" }),
  createMembershipBadgePlugin({ level: 3 }),
  createFollowEchoPlugin({ onFollow: toggleFollow }),
  createMessageButtonPlugin({ onMessage: () => openChat(user.id) }),
  createWorksGridPlugin({ items: user.works, tab: "works", columns: 3 }),
  createAchievementWallPlugin({ items: user.badges, tab: "about", title: "成就" }),
]);
```

> `WorksGrid` 设了 `tab: "works"`：只在「作品」页签激活时出网格，与 `TabSync` 天然联动。`AchievementWall` 同理挂在「关于」页签。`renderBioArea` 的 BioSlot / SocialLinks / TagList / LiveStatus / ContactCard 按 `priority` 串联，整体位于头图与数据行之间。徽标区用 `MembershipBadge` 与 `VerifyBadge` 并排，关注区用 `MessageButton` 与 `FollowEcho` 并排。

## 3. 企业号主页（Brand）

机构认证（`institution` 配色），简介区用一句话定位，内容区直接随页签切换（不装 WorksGrid，回退 children）；徽标区加会员角标与二维码分享。

```tsx
export const BrandProfile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ gradient: ["#0f2027", "#2c5364"], overlay: <strong>{org.name}</strong> }),
  createBioSlotPlugin({ bio: org.slogan }),
  createStatRowPlugin({ items: org.stats, direction: "row" }),
  createTabSyncPlugin({ tabs: [
    { id: "intro", label: "简介" },
    { id: "news", label: "动态" },
    { id: "contact", label: "联系" },
  ] }),
  createVerifyBadgePlugin({ type: "institution", label: "官方" }),
  createMembershipBadgePlugin({ level: 2, label: "企业会员" }),
  createQRSharePlugin({ url: org.homeUrl }),
]);

// 内容区用 children 自行订阅 activeTab
function BrandContent() {
  const { activeTab } = useProfileContext();
  if (activeTab === "news") return <NewsList />;
  if (activeTab === "contact") return <ContactCard />;
  return <Intro />;
}
```

## 4. 极简主页（Minimal）

只要头图 + 数据行，连页签和关注都不要，适合卡片式嵌入。

```tsx
export const MinimalProfile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ gradient: ["#ee9ca7", "#ffdde1"], avatar: user.avatar, avatarRound: true }),
  createStatRowPlugin({ items: user.stats, divider: false }),
]);
```

## 推荐做法

- 常用组合沉淀为配方导出在包内（建议 3-5 个起步，不设上限），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- 低频 / 重型插件用动态导入：`const { createWorksGridPlugin } = await import("vane-profile/custom-plugins/WorksGridPlugin")`；
- 每个插件都可单独单测：在 happy-dom 里直接调工厂拿 `plugin.hooks.renderXxxArea(context)` 断言输出。
