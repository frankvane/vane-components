# 个人主页引擎 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AchievementWall](./AchievementWall) | 成就 / 勋章墙：随 activeTab 联动的内容区插件。 | `items` = []<br/>`columns` = 4<br/>`gap` = 10<br/>`tab` = -<br/>`title` = -<br/>`empty` = 暂无成就 | 0.1.0 | content, achievement, renderContentArea |
| [ActivitySummary](./ActivitySummary) | 活跃度小结：最近活跃 / 本月发布 / 总阅读，一行小字。 | `lastActive` = -<br/>`postsThisMonth` = -<br/>`totalViews` = -<br/>`showIcon` = true | 0.1.0 | activity, meta, renderBioArea |
| [BannerSlot](./BannerSlot) | 头图区：封面图或渐变背景打底，左下角浮出头像（与数据行区重叠），并可叠加昵称 / 标语文案。读取 props.banner 作为默认叠加内容。 | `cover` = ""<br/>`gradient` = ["#6a11cb", "#2575fc"]<br/>`avatar` = ""<br/>`avatarSize` = 64<br/>`avatarRound` = true<br/>`height` = 160<br/>`overlay` = context.banner | 0.1.0 | ui, banner, 头图 |
| [BioSlot](./BioSlot) | 简介区：昵称 + 签名 + 所在地 / 加入时间。 | `name` = -<br/>`subtitle` = -<br/>`bio` = -<br/>`location` = -<br/>`joinDate` = - | 0.1.0 | intro, bio, renderBioArea |
| [ContactCard](./ContactCard) | 联系信息卡：邮箱 / 电话 / 官网 / 地址，安全链接。 | `email` = -<br/>`phone` = -<br/>`site` = -<br/>`address` = -<br/>`showIcon` = true | 0.1.0 | contact, info, renderBioArea |
| [FollowEcho](./FollowEcho) | 关注回显：关注 / 已关注 / 互相关注三态按钮，受控于 props.followState。点击仅作乐观 UI，真相由消费方回写；关系变为 mutual 时可触发 onMutual。 | `state` = props.followState<br/>`labels` = { none: 关注, following: 已关注, mutual: 互相关注 }<br/>`size` = md<br/>`onFollow` = -<br/>`onMutual` = - | 0.1.0 | ui, follow, 关注 |
| [LiveStatus](./LiveStatus) | 在线 / 直播状态指示：圆点 + 文案，直播态高亮。 | `status` = online<br/>`liveTitle` = -<br/>`showLabel` = true | 0.1.0 | status, live, renderBioArea |
| [MembershipBadge](./MembershipBadge) | 会员 / VIP 等级角标：浮于头图右上，与认证徽标同区并排。 | `level` = 1<br/>`label` = -<br/>`showLabel` = true | 0.1.0 | ui, badge, vip, renderBadgeArea |
| [MessageButton](./MessageButton) | 私信按钮：与关注回显同区并排，点击拉起会话。 | `size` = md<br/>`label` = 私信<br/>`onMessage` = - | 0.1.0 | ui, message, 私信, renderFollowArea |
| [QRShare](./QRShare) | 主页二维码分享：浮于头图右上的分享按钮，点击展开二维码与复制链接。 | `url` = https://vane.dev/u/frankvane<br/>`buttonLabel` = 分享<br/>`size` = 96 | 0.1.0 | ui, share, qr, renderBadgeArea |
| [SocialLinks](./SocialLinks) | 社交外链行：一排可点击的平台入口（微博 / 知乎 / GitHub …）。 | `links` = []<br/>`showLabel` = true<br/>`align` = 'left' | 0.1.0 | social, links, renderBioArea |
| [StatRow](./StatRow) | 数据行：把关注 / 粉丝 / 获赞 / 作品等指标横排展示，每项显示「值 + 标签」。数据源为 config.items 或 props.stats。 | `items` = context.stats<br/>`direction` = row<br/>`divider` = true<br/>`onStatClick` = - | 0.1.0 | ui, stats, 数据 |
| [TabSync](./TabSync) | 页签系统：渲染页签栏（underline / pill / segmented 三种样式），点击切换 activeTab，并联动内容区重渲染。切换时默认把容器滚到顶部。 | `tabs` = -<br/>`variant` = underline<br/>`sticky` = false<br/>`scrollTopOnChange` = true<br/>`onChange` = - | 0.1.0 | ui, tab, 页签 |
| [TagList](./TagList) | 兴趣 / 标签行：一排圆角小标签。 | `tags` = []<br/>`align` = 'left' | 0.1.0 | tags, interest, renderBioArea |
| [VerifyBadge](./VerifyBadge) | 认证徽标：个人 / 机构两种认证对勾（内联 SVG，无外部资源），浮于头图右上角。verified 为 false 时不渲染。 | `verified` = props.verified<br/>`type` = props.badgeType<br/>`label` = 按 type 给「认证」/「机构认证」<br/>`showLabel` = true | 0.1.0 | ui, badge, 认证 |
| [WorksGrid](./WorksGrid) | 作品网格：随 activeTab 联动的内容区插件。 | `items` = []<br/>`columns` = 3<br/>`gap` = 10<br/>`tab` = -<br/>`title` = -<br/>`empty` = 暂无作品 | 0.1.0 | content, grid, works, renderContentArea |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出 + `Object.assign(create, { meta: doc })`）；
3. 跑 `pnpm docs:plugins` 重新生成 `docs/plugins.md` 本表和文档站导航；
4. `README.md` 为手写（含 npm 专属内容），新增插件后请同步更新 README 的「插件目录速览」与计数。
