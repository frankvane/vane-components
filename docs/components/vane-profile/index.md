# 个人主页引擎

> 插件式个人主页引擎：`ProfileCore` 负责三段式布局壳，其余能力（头图 / 简介 / 数据行 / 社交 / 标签 / 页签 / 认证 / 关注 / 作品）全部通过插件按需组合。
>
> 16 个官方插件各管一块，**要哪几个装哪几个，没装的区块不进产物**。

## 特性

- **区块即插件**：16 个领域插件，分别挂在 7 个领域槽（头图 / 简介 / 数据行 / 页签 / 徽标 / 关注 / 内容）上，互不覆盖
- **页签驱动内容联动**：`TabSync` 把 `activeTab` 写进内核 state，内容区子节点经 `useProfileContext().activeTab` 订阅——切页签即重渲染
- **领域槽复用内核基建**：头图 / 简介 / 数据行 / 页签 / 徽标 / 关注 / 内容区走包内 `renderProfileSlot`（复用内核 order 排序 + `priority` 决策 + `PluginErrorBoundary` 单槽隔离），单槽渲染抛错不影响其他槽
- **受控关注态**：`FollowEcho` 是乐观 UI，真相由消费方回写 `props.followState`；关系变为互相关注时触发 `onMutual`
- **Tree-shaking 友好**：根入口不桶导出插件，每个插件走独立子路径，未引入的不进产物
- **零运行时依赖**（`vane-plugin-core` / react / react-dom 均为 peer），不引 CSS 文件

## 安装

```bash
npm install vane-profile
```

## 30 秒上手

```tsx
import { ProfileCore, withPlugins, useProfileContext } from "vane-profile";
import { createBannerSlotPlugin } from "vane-profile/custom-plugins/BannerSlot";
import { createStatRowPlugin } from "vane-profile/custom-plugins/StatRow";
import { createTabSyncPlugin } from "vane-profile/custom-plugins/TabSync";
import { createVerifyBadgePlugin } from "vane-profile/custom-plugins/VerifyBadge";
import { createFollowEchoPlugin } from "vane-profile/custom-plugins/FollowEcho";

// 装配：一个组件类型，模块顶层调一次
const Profile = withPlugins(ProfileCore, [
  createBannerSlotPlugin({ gradient: ["#6a11cb", "#2575fc"], avatar: user.avatar, overlay: user.name }),
  createStatRowPlugin({ items: user.stats }),
  createTabSyncPlugin({ tabs: [
    { id: "posts", label: "作品" },
    { id: "likes", label: "喜欢" },
  ] }),
  createVerifyBadgePlugin({ type: "personal" }),
  createFollowEchoPlugin({ onFollow: setFollowing }),
]);

// 使用：普通组件，内容区随 activeTab 切换
function ProfilePage({ user }: { user: User }) {
  return (
    <Profile
      verified={user.verified}
      badgeType={user.badgeType}
      followState={user.followState}
      containerStyle={{ maxWidth: 720, margin: "0 auto" }}
    >
      <ProfileContent />
    </Profile>
  );
}

function ProfileContent() {
  const { activeTab } = useProfileContext();
  return activeTab === "likes" ? <Likes/> : <Posts/>;
}
```

`ProfileCore` 的三段式布局壳自带：头图区 → 简介区（昵称 / 社交 / 标签）→（数据行 + 关注区）meta 区 → 页签栏 → 内容区。内容区默认是 `children`，被内容插件（`WorksGrid`）接管后由其渲染并随 `activeTab` 联动。

## 导入方式与体积

| 导入 | 内容 | 实测 Gzip（消费方真实代价）|
| --- | --- | --- |
| `vane-profile` | 核心 + 装配 + 领域槽 + 类型（不含任何插件） | **3.0 KB**（预算 3.5 KB）|
| `vane-profile/entries/core` | 同上，只含 `ProfileCore` + 领域槽（无 `withPlugins`）| ~1.8 KB |
| `vane-profile/custom-plugins/BannerSlot` | 单个插件（16 选 n）| 1.6–2.0 KB |
| `vane-profile/custom-plugins/*` | 通配子路径，按需取 | 1.6–2.0 KB |
| `vane-profile/custom-plugins` | 桶文件 + 16 个插件（逃生口，常规不推荐）| ~16 KB |

> 根入口**不桶导出插件**——插件请走子路径，未引入的不进产物。`vane-profile/custom-plugins` 桶文件是逃生口（工坊 / 内部后台 / 原型可一次拿全量），但会带入全部 16 个插件。

## 包内有什么

```
ProfileCore                三段式布局壳 + ref 契约 + 内容区订阅，不含业务行为
withPlugins                装配层：内核 runtime + 领域上下文 + Core 回调桥接
plugins/slots.tsx          ProfileSlotProvider / renderProfileSlot / useProfileSlot / useProfileContext
plugins/types.ts           ProfileCoreProps / ProfileCoreRef / ProfilePluginContext / ProfilePluginHooks
custom-plugins/            16 个领域插件（BannerSlot / BioSlot / StatRow / SocialLinks / TabSync /
                           TagList / VerifyBadge / FollowEcho / WorksGrid）
demo/                      演示站：12 个示例页（基础 1 + 插件 9 + 高级 2）+ 工坊 + 4 场景（不随包发布）
```

## 插件目录速览

| 插件 | 领域槽 | 一句话 |
| --- | --- | --- |
| `BannerSlot` | `renderBannerArea` | 封面 / 渐变 + 头像浮层 + 叠加文案 |
| `BioSlot` | `renderBioArea` | 昵称 / 签名 / 所在地 / 加入时间 |
| `StatRow` | `renderStatRow` | 关注 / 粉丝 / 获赞 / 作品指标横排 |
| `SocialLinks` | `renderBioArea` | 一排可点击的社交外链入口 |
| `TabSync` | `renderTabBar` | 渲染页签 + 切换联动内容区（交互中枢）|
| `TagList` | `renderBioArea` | 一排圆角兴趣标签 |
| `VerifyBadge` | `renderBadgeArea` | 个人 / 机构认证对勾，浮于头图右上 |
| `FollowEcho` | `renderFollowArea` | 关注 / 已关注 / 互相关注三态按钮 |
| `WorksGrid` | `renderContentArea` | 随 activeTab 联动的作品网格 |
| `MembershipBadge` | `renderBadgeArea` | 会员 / VIP 等级角标，与认证同区并排 |
| `QRShare` | `renderBadgeArea` | 主页二维码分享，点击展开 + 复制链接 |
| `LiveStatus` | `renderBioArea` | 在线 / 离开 / 忙碌 / 离线 / 直播中状态 |
| `ContactCard` | `renderBioArea` | 邮箱 / 电话 / 官网 / 地址，安全链接 |
| `ActivitySummary` | `renderBioArea` | 最近活跃 / 本月发布 / 总阅读，一行小字 |
| `MessageButton` | `renderFollowArea` | 私信按钮，与关注并排 |
| `AchievementWall` | `renderContentArea` | 成就 / 勋章墙，随 activeTab 联动 |

完整配置项见 [插件目录](plugins.md)。

## 文档

- [API](api.md)
- [插件目录](plugins.md)
- [组合配方](recipes.md)

## License

MIT
