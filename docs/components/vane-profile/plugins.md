# 个人主页引擎 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->

> 本文档由 `scripts/generate-plugin-docs.mjs` 从各插件 `doc.json` 自动生成，请勿手改；新增插件请写 `doc.json` 后跑 `pnpm docs:plugins`。

当前共 **16** 个官方插件，覆盖 **7 个领域槽**（`renderBannerArea` / `renderBioArea` / `renderStatRow` / `renderTabBar` / `renderBadgeArea` / `renderFollowArea` / `renderContentArea`）及页签切换事件钩子 `onTabChange`。

## 速览

| 插件 | 领域槽 | since | 一句话 |
| --- | --- | --- | --- |
| `AchievementWall` | `renderContentArea` | 0.1.0 | 成就 / 勋章墙 |
| `ActivitySummary` | `renderBioArea` | 0.1.0 | 活跃度小结 |
| `BannerSlot` | `renderBannerArea` | 0.1.0 | 头图区 |
| `BioSlot` | `renderBioArea` | 0.1.0 | 简介区 |
| `ContactCard` | `renderBioArea` | 0.1.0 | 联系信息卡 |
| `FollowEcho` | `renderFollowArea` | 0.1.0 | 关注回显 |
| `LiveStatus` | `renderBioArea` | 0.1.0 | 在线 / 直播状态指示 |
| `MembershipBadge` | `renderBadgeArea` | 0.1.0 | 会员 / VIP 等级角标 |
| `MessageButton` | `renderFollowArea` | 0.1.0 | 私信按钮 |
| `QRShare` | `renderBadgeArea` | 0.1.0 | 主页二维码分享 |
| `SocialLinks` | `renderBioArea` | 0.1.0 | 社交外链行 |
| `StatRow` | `renderStatRow` | 0.1.0 | 数据行 |
| `TabSync` | `renderTabBar` | 0.1.0 | 页签系统 |
| `TagList` | `renderBioArea` | 0.1.0 | 兴趣 / 标签行 |
| `VerifyBadge` | `renderBadgeArea` | 0.1.0 | 认证徽标 |
| `WorksGrid` | `renderContentArea` | 0.1.0 | 作品网格 |

## 插件详情

### AchievementWall

**领域槽** `renderContentArea` · **since** 0.1.0 · **标签** `content` `achievement` `renderContentArea`

成就 / 勋章墙：随 activeTab 联动的内容区插件。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `AchievementItem[]` | `[]` | 成就列表，每项含 id / title / 可选 desc / glyph / color |
| `columns` | `number` | `4` | 网格列数 |
| `gap` | `number` | `10` | 卡片间距（px） |
| `tab` | `string` | `-` | 仅在某个页签激活时显示（与 TabSync 联动）；不填则始终显示 |
| `title` | `ReactNode` | `-` | 分组标题 |
| `empty` | `ReactNode` | `暂无成就` | 空列表占位文案 |

**特性**
- 走 renderContentArea 领域槽，Core 有内容插件时替代 children
- config.tab 与 context.activeTab 联动：切到对应页签才出墙
- 图标用单/双字占位，无图也能离线演示
- 与 WorksGrid 同区可共存（按 priority 纵向排列）

**适用场景**
- 个人主页成就展示
- 创作者荣誉墙
- 游戏 / 社区勋章系统

**注意**
- 与 WorksGrid 同在内容区时，两者按 priority 纵向排列，互不覆盖。

**示例**

```tsx
// 成就墙，挂在「关于」页签下。
const Profile = withPlugins(ProfileCore, [
  createTabSyncPlugin({ tabs: [{ id: "about", label: "关于" }] }),
  createAchievementWallPlugin({ items: user.badges, tab: "about", title: "成就" }),
]);
```

### ActivitySummary

**领域槽** `renderBioArea` · **since** 0.1.0 · **标签** `activity` `meta` `renderBioArea`

活跃度小结：最近活跃 / 本月发布 / 总阅读，一行小字。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `lastActive` | `string` | `-` | 最近活跃描述，如「2 小时前」 |
| `postsThisMonth` | `number` | `-` | 本月发布篇数 |
| `totalViews` | `string` | `-` | 总阅读量描述，如「120w」 |
| `showIcon` | `boolean` | `true` | 是否显示时钟图标字 |

**特性**
- 走 renderBioArea 领域槽，与简介区其他插件同区串联
- 三项可任意组合，全空不渲染
- 浅色小字，不抢简介主体

**适用场景**
- 创作者活跃度展示
- 社区用户粘性提示
- 需要轻量数据小结的档案

**注意**
- 数据由消费方计算后传入，本插件只做展示。

**示例**

```tsx
// 活跃度小结一行字。
const Profile = withPlugins(ProfileCore, [
  createActivitySummaryPlugin({ lastActive: "2 小时前", postsThisMonth: 12, totalViews: "120w" }),
]);
```

### BannerSlot

**领域槽** `renderBannerArea` · **since** 0.1.0 · **标签** `ui` `banner` `头图`

头图区：封面图或渐变背景打底，左下角浮出头像（与数据行区重叠），并可叠加昵称 / 标语文案。读取 props.banner 作为默认叠加内容。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cover` | `string` | `""` | 封面图 URL；与 gradient 至少其一 |
| `gradient` | `[string, string]` | `["#6a11cb", "#2575fc"]` | 渐变起止色，无 cover 时作背景 |
| `avatar` | `string` | `""` | 头像 URL，浮于头图左下 |
| `avatarSize` | `number` | `64` | 头像直径（px） |
| `avatarRound` | `boolean` | `true` | 头像是否圆形 |
| `height` | `number` | `160` | 头图区高度（px） |
| `overlay` | `ReactNode` | `context.banner` | 叠加文案，缺省用 props.banner |

**特性**
- 封面图 / 渐变背景二选一
- 头像浮层与数据行区重叠（经典主页观感）
- 叠加文案支持自定义或复用 props.banner

**适用场景**
- 社交平台个人主页头部
- 创作者 / 品牌主页
- 需要头像 + 封面组合的任意档案页

**注意**
- 头像以负 bottom 浮出，父容器不要设 overflow:hidden 否则会被裁切。

**示例**

```tsx
// 头图 + 头像 + 昵称标语。
const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({
    cover: user.cover,
    avatar: user.avatar,
    overlay: <strong>{user.name}</strong>,
  }),
]);

<Profile banner={<span>@{user.handle}</span>} />;
```

### BioSlot

**领域槽** `renderBioArea` · **since** 0.1.0 · **标签** `intro` `bio` `renderBioArea`

简介区：昵称 + 签名 + 所在地 / 加入时间。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | `ReactNode` | `-` | 昵称（头图已用 overlay 显示时留空，避免重复） |
| `subtitle` | `ReactNode` | `-` | 副标题 / 职业，显示在昵称下方小字 |
| `bio` | `ReactNode` | `-` | 个性签名 / 一句话简介 |
| `location` | `string` | `-` | 所在地 |
| `joinDate` | `string` | `-` | 加入时间，如「2021 加入」 |

**特性**
- 走 renderBioArea 领域槽，排在头图与数据行之间
- name/subtitle/bio/meta 全部为空时整体不渲染（不占空间）

**适用场景**
- 个人主页的签名档
- 企业号的一句话简介

**注意**
- 与 BannerSlot 的 overlay 各自独立：overlay 浮在头图上，本插件在头像下方的简介区

### ContactCard

**领域槽** `renderBioArea` · **since** 0.1.0 · **标签** `contact` `info` `renderBioArea`

联系信息卡：邮箱 / 电话 / 官网 / 地址，安全链接。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `email` | `string` | `-` | 邮箱，渲染为 mailto: 链接 |
| `phone` | `string` | `-` | 电话，渲染为 tel: 链接 |
| `site` | `string` | `-` | 官网，外链带 rel 防钓鱼 |
| `address` | `string` | `-` | 地址，纯文本不渲染为链接 |
| `showIcon` | `boolean` | `true` | 是否显示左侧图标字 |

**特性**
- 走 renderBioArea 领域槽，与 BioSlot / SocialLinks / TagList 同区串联
- 邮箱走 mailto:、电话走 tel:、官网走 http(s) 外链
- 外链一律 rel=noreferrer noopener，防反向携带来源页信息
- 四项全空时整体不渲染

**适用场景**
- 商家 / 机构主页联系入口
- 创作者商务合作方式
- 需要公开联系方式的任意档案

**注意**
- 地址为纯文本（不渲染为链接），避免误导用户点击。

**示例**

```tsx
// 联系信息卡：邮箱 + 官网。
const Profile = withPlugins(ProfileCore, [
  createContactCardPlugin({ email: "frank@vane.dev", site: "https://vane.dev" }),
]);
```

### FollowEcho

**领域槽** `renderFollowArea` · **since** 0.1.0 · **标签** `ui` `follow` `关注`

关注回显：关注 / 已关注 / 互相关注三态按钮，受控于 props.followState。点击仅作乐观 UI，真相由消费方回写；关系变为 mutual 时可触发 onMutual。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `state` | `"none" | "following" | "mutual"` | `props.followState` | 强制关注态，覆盖 props.followState |
| `labels` | `Partial<Record<FollowState, ReactNode>>` | `{ none: 关注, following: 已关注, mutual: 互相关注 }` | 三态文案覆盖 |
| `size` | `"sm" | "md"` | `md` | 按钮尺寸 |
| `onFollow` | `function` | `-` | 点击切换后的回调 |
| `onMutual` | `function` | `-` | 关系变为 mutual 时的回调 |

**特性**
- 三态受控按钮
- 点击乐观切换，真相回写 props
- 关系变为 mutual 触发 onMutual
- 点击态 / 已关注态样式区分

**适用场景**
- 个人主页关注按钮
- 用户卡片关注态
- 需要关注关系回显的任意档案

**注意**
- 按钮为受控组件，关注真相请由消费方维护并回写 props.followState。

**示例**

```tsx
// 关注按钮，受控于服务端返回的 followState。
const Profile = withPlugins(ProfileCore, [
  createFollowEchoPlugin({
    onFollow: (next) => api.toggleFollow(uid, next),
  }),
]);

<Profile followState={serverState} />;
```

### LiveStatus

**领域槽** `renderBioArea` · **since** 0.1.0 · **标签** `status` `live` `renderBioArea`

在线 / 直播状态指示：圆点 + 文案，直播态高亮。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `status` | `"online" | "away" | "busy" | "offline" | "live"` | `online` | 状态类型，决定圆点颜色与文案 |
| `liveTitle` | `string` | `-` | status=live 时的直播标题 |
| `showLabel` | `boolean` | `true` | 是否展示文案（仅圆点为 false） |

**特性**
- 走 renderBioArea 领域槽，与 BioSlot / SocialLinks / TagList 同区串联
- 5 种状态（在线/离开/忙碌/离线/直播中）配色
- 直播态红点带光晕，可附直播标题

**适用场景**
- 主播 / 达人主页实时状态
- 客服在线标识
- 社区用户活跃状态

**注意**
- 状态为展示态，真实在线与否由消费方按业务维护并回写 config。

**示例**

```tsx
// 直播中状态，红点高亮。
const Profile = withPlugins(ProfileCore, [
  createLiveStatusPlugin({ status: "live", liveTitle: "前端架构夜聊" }),
]);
```

### MembershipBadge

**领域槽** `renderBadgeArea` · **since** 0.1.0 · **标签** `ui` `badge` `vip` `renderBadgeArea`

会员 / VIP 等级角标：浮于头图右上，与认证徽标同区并排。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `level` | `1 | 2 | 3` | `1` | 会员等级，决定配色与默认文案 |
| `label` | `ReactNode` | `-` | 覆盖默认文案；缺省按 level 给 VIP{n} |
| `showLabel` | `boolean` | `true` | 是否展示文案（仅图标时为 false） |

**特性**
- 走 renderBadgeArea 领域槽，与 VerifyBadge / QRShare 同区横向并排
- 三档配色（VIP1 铜 / VIP2 银 / VIP3 金）
- 可覆盖文案，支持仅图标模式

**适用场景**
- 付费会员主页标识
- 社区等级展示
- 需要身份分级的任意档案

**注意**
- 浮于头图右上角；ProfileCore 已将该区设为 flex 行排，多徽标不会错位。

**示例**

```tsx
// 金色 VIP3 角标，浮于头图右上。
const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ avatar: user.avatar }),
  createMembershipBadgePlugin({ level: 3 }),
]);
```

### MessageButton

**领域槽** `renderFollowArea` · **since** 0.1.0 · **标签** `ui` `message` `私信` `renderFollowArea`

私信按钮：与关注回显同区并排，点击拉起会话。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `"sm" | "md"` | `md` | 按钮尺寸 |
| `label` | `ReactNode` | `私信` | 按钮文案 |
| `onMessage` | `function` | `-` | 点击回调，参数为领域上下文 |

**特性**
- 走 renderFollowArea 领域槽，与 FollowEcho 横向并排
- 描边样式，与关注实心按钮形成主次
- 点击触发 onMessage（消费方拉起会话）

**适用场景**
- 主页私信入口
- 客服会话触发
- 需要一对一沟通的场景

**注意**
- 按钮为无状态触发器，会话逻辑由消费方在 onMessage 里实现。

**示例**

```tsx
// 私信按钮，与关注并排。
const Profile = withPlugins(ProfileCore, [
  createFollowEchoPlugin({ onFollow: toggleFollow }),
  createMessageButtonPlugin({ onMessage: () => openChat(uid) }),
]);
```

### QRShare

**领域槽** `renderBadgeArea` · **since** 0.1.0 · **标签** `ui` `share` `qr` `renderBadgeArea`

主页二维码分享：浮于头图右上的分享按钮，点击展开二维码与复制链接。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | `https://vane.dev/u/frankvane` | 要分享的主页地址 |
| `buttonLabel` | `ReactNode` | `分享` | 按钮文案 |
| `size` | `number` | `96` | 二维码占位区边长（px） |

**特性**
- 走 renderBadgeArea 领域槽，与 VerifyBadge / MembershipBadge 同区横向并排
- 点击展开分享面板（useState 控制）
- 面板提供「复制链接」（navigator.clipboard）
- 二维码为装饰性点阵占位，零外部依赖

**适用场景**
- 主页分享入口
- 线下物料扫码引流
- 需要快速传播主页链接的场景

**注意**
- 二维码为视觉占位（确定性点阵，非真实可扫码）；接入真实扫码请替换面板内的点阵为二维码库输出。

**示例**

```tsx
// 头图右上分享按钮，点击展开二维码 + 复制链接。
const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ avatar: user.avatar }),
  createQRSharePlugin({ url: user.homeUrl }),
]);
```

### SocialLinks

**领域槽** `renderBioArea` · **since** 0.1.0 · **标签** `social` `links` `renderBioArea`

社交外链行：一排可点击的平台入口（微博 / 知乎 / GitHub …）。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `links` | `SocialLink[]` | `[]` | 外链列表，每项含 platform / href / 可选 label / glyph |
| `showLabel` | `boolean` | `true` | 是否显示文案（仅图标字时为 false） |
| `align` | `'left' | 'center' | 'right'` | `'left'` | 整组对齐方式 |

**特性**
- 走 renderBioArea 领域槽，与 BioSlot / TagList 同区串联
- 图标用单/双字占位（无图片资源），链接新窗口打开并带 rel 防钓鱼
- 常见平台（微博/知乎/GitHub…）有默认文案与图标字

**适用场景**
- 主页底部的社交入口聚合
- 创作者主页的外链引流

**注意**
- 链接一律 target=_blank + rel=noreferrer noopener，避免反向携带来源页信息

### StatRow

**领域槽** `renderStatRow` · **since** 0.1.0 · **标签** `ui` `stats` `数据`

数据行：把关注 / 粉丝 / 获赞 / 作品等指标横排展示，每项显示「值 + 标签」。数据源为 config.items 或 props.stats。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `StatItem[]` | `context.stats` | 显式指标；缺省读 props.stats |
| `direction` | `"row" | "column"` | `row` | 排布方向 |
| `divider` | `boolean` | `true` | row 模式下项间分隔线 |
| `onStatClick` | `function` | `-` | 点击回调，可在此 setActiveTab 联动页签 |

**特性**
- 支持 config.items 覆盖 props.stats
- row / column 两种排布
- 可选分隔线
- 点击回调可联动页签

**适用场景**
- 个人主页指标展示
- 创作者数据概览
- 任意需要「值 + 标签」成组展示的场景

**注意**
- divider 仅在 direction=row 时生效。

**示例**

```tsx
// 关注 / 粉丝 / 获赞 / 作品。
const Profile = withPlugins(ProfileCore, [
  createStatRowPlugin({
    items: [
      { value: 128, label: "关注" },
      { value: 1.2, label: "粉丝" },
      { value: 48, label: "获赞" },
      { value: 9, label: "作品" },
    ],
  }),
]);
```

### TabSync

**领域槽** `renderTabBar` · **since** 0.1.0 · **标签** `ui` `tab` `页签`

页签系统：渲染页签栏（underline / pill / segmented 三种样式），点击切换 activeTab，并联动内容区重渲染。切换时默认把容器滚到顶部。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tabs` | `TabItem[]` | `-` | 页签定义 { id, label, icon? }，至少一项 |
| `variant` | `"underline" | "pill" | "segmented"` | `underline` | 样式变体 |
| `sticky` | `boolean` | `false` | 是否吸顶 |
| `scrollTopOnChange` | `boolean` | `true` | 切换时容器滚到顶部 |
| `onChange` | `function` | `-` | 切换回调 (id, oldId) |

**特性**
- 三种样式变体
- 点击切换 activeTab
- 内容区经 useProfileContext 自动联动
- 可选吸顶 + 切换滚动复位

**适用场景**
- 多内容区主页
- 作品 / 动态 / 收藏 切换
- 需要页签驱动的任意档案页

**注意**
- 内容区必须是消费 useProfileContext().activeTab 的子组件；TabSync 本身不渲染内容。

**示例**

```tsx
// 作品 / 动态 / 关于 三个页签。
const Profile = withPlugins(ProfileCore, [
  createTabSyncPlugin({
    tabs: [
      { id: "works", label: "作品" },
      { id: "feeds", label: "动态" },
      { id: "about", label: "关于" },
    ],
  }),
]);

<Profile>
  <ProfileContent /> // 内部 useProfileContext().activeTab 决定渲染哪段
</Profile>;
```

### TagList

**领域槽** `renderBioArea` · **since** 0.1.0 · **标签** `tags` `interest` `renderBioArea`

兴趣 / 标签行：一排圆角小标签。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tags` | `string[]` | `[]` | 标签文本列表 |
| `align` | `'left' | 'center' | 'right'` | `'left'` | 整组对齐方式 |

**特性**
- 走 renderBioArea 领域槽，与 BioSlot / SocialLinks 同区串联
- tags 为空时整体不渲染

**适用场景**
- 个人主页的兴趣标签墙
- 创作者主页的内容领域标记

**注意**
- 标签样式用半透明底色，跟随容器文字颜色，不引入额外主题变量

### VerifyBadge

**领域槽** `renderBadgeArea` · **since** 0.1.0 · **标签** `ui` `badge` `认证`

认证徽标：个人 / 机构两种认证对勾（内联 SVG，无外部资源），浮于头图右上角。verified 为 false 时不渲染。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `verified` | `boolean` | `props.verified` | 强制认证态，覆盖 props.verified |
| `type` | `"personal" | "institution"` | `props.badgeType` | 认证类型，改变徽标颜色与默认文字 |
| `label` | `ReactNode` | `按 type 给「认证」/「机构认证」` | 徽标旁文字 |
| `showLabel` | `boolean` | `true` | 是否展示文字 |

**特性**
- 个人 / 机构两种配色
- 内联 SVG，零外部依赖
- 浮于头图右上角
- verified=false 自动隐藏

**适用场景**
- 认证用户主页标识
- 品牌 / 机构官方账号
- 需要信任标识的任意档案

**注意**
- 默认读取 props.verified / props.badgeType，也可经 config 强制覆盖。

**示例**

```tsx
// 个人认证徽标。
const Profile = withPlugins(ProfileCore, [
  createVerifyBadgePlugin({ type: "personal" }),
]);

<Profile verified badgeType="personal" />;
```

### WorksGrid

**领域槽** `renderContentArea` · **since** 0.1.0 · **标签** `content` `grid` `works` `renderContentArea`

作品网格：随 activeTab 联动的内容区插件。

**配置项**

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `WorkItem[]` | `[]` | 作品列表，每项含 id / title / 可选 cover / coverColor / meta |
| `columns` | `number` | `3` | 网格列数 |
| `gap` | `number` | `10` | 卡片间距（px） |
| `tab` | `string` | `-` | 仅在某个页签激活时显示（与 TabSync 联动）；不填则始终显示 |
| `title` | `ReactNode` | `-` | 网格上方的分组标题 |
| `empty` | `ReactNode` | `暂无作品` | 空列表占位文案 |

**特性**
- 走 renderContentArea 领域槽，Core 有内容插件时以它替代 children
- config.tab 与 context.activeTab 联动：切到对应页签才出网格
- 封面支持图片 URL 或纯色占位，无图也能离线演示

**适用场景**
- 个人主页的作品 / 相册网格
- 创作者主页的笔记 / 视频墙

**注意**
- 与 TabSync 文本 children 二选一：装了 WorksGrid 后内容区由它接管


<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出 + `Object.assign(create, { meta: doc })`）；
3. 跑 `pnpm docs:plugins` 重新生成 `docs/plugins.md` 本表和文档站导航；
4. `README.md` 为手写（含 npm 专属内容），新增插件后请同步更新 README 的「插件目录速览」与计数。
