# 个人主页引擎 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AchievementWall](#achievementwall) | 成就 / 勋章墙：随 activeTab 联动的内容区插件。 | `items` = []<br/>`columns` = 4<br/>`gap` = 10<br/>`tab` = -<br/>`title` = -<br/>`empty` = 暂无成就 | 0.1.0 | content, achievement, renderContentArea |
| [ActivitySummary](#activitysummary) | 活跃度小结：最近活跃 / 本月发布 / 总阅读，一行小字。 | `lastActive` = -<br/>`postsThisMonth` = -<br/>`totalViews` = -<br/>`showIcon` = true | 0.1.0 | activity, meta, renderBioArea |
| [BannerSlot](#bannerslot) | 头图区：封面图或渐变背景打底，左下角浮出头像（与数据行区重叠），并可叠加昵称 / 标语文案。读取 props.banner 作为默认叠加内容。 | `cover` = ""<br/>`gradient` = ["#6a11cb", "#2575fc"]<br/>`avatar` = ""<br/>`avatarAlt` = 头像<br/>`avatarFallback` = 人形占位<br/>`avatarSize` = 64<br/>`avatarRound` = true<br/>`height` = 160<br/>`overlay` = context.banner | 0.1.0 | ui, banner, 头图 |
| [BioSlot](#bioslot) | 简介区：昵称 + 签名 + 所在地 / 加入时间。 | `name` = -<br/>`subtitle` = -<br/>`bio` = -<br/>`location` = -<br/>`joinDate` = - | 0.1.0 | intro, bio, renderBioArea |
| [ContactCard](#contactcard) | 联系信息卡：邮箱 / 电话 / 官网 / 地址，安全链接。 | `email` = -<br/>`phone` = -<br/>`site` = -<br/>`address` = -<br/>`showIcon` = true | 0.1.0 | contact, info, renderBioArea |
| [FollowEcho](#followecho) | 关注回显：关注 / 已关注 / 互相关注三态按钮，受控于 props.followState。点击仅作乐观 UI，真相由消费方回写；关系变为 mutual 时可触发 onMutual。 | `state` = props.followState<br/>`labels` = { none: 关注, following: 已关注, mutual: 互相关注 }<br/>`size` = md<br/>`onFollow` = -<br/>`onMutual` = - | 0.1.0 | ui, follow, 关注 |
| [LiveStatus](#livestatus) | 在线 / 直播状态指示：圆点 + 文案，直播态高亮。 | `status` = online<br/>`liveTitle` = -<br/>`showLabel` = true | 0.1.0 | status, live, renderBioArea |
| [MembershipBadge](#membershipbadge) | 会员 / VIP 等级角标：浮于头图右上，与认证徽标同区并排。 | `level` = 1<br/>`label` = -<br/>`showLabel` = true | 0.1.0 | ui, badge, vip, renderBadgeArea |
| [MessageButton](#messagebutton) | 私信按钮：与关注回显同区并排，点击拉起会话。 | `size` = md<br/>`label` = 私信<br/>`onMessage` = - | 0.1.0 | ui, message, 私信, renderFollowArea |
| [QRShare](#qrshare) | 主页二维码分享：浮于头图右上的分享按钮，点击展开二维码与复制链接。 | `url` = props.data.homeUrl<br/>`buttonLabel` = 分享<br/>`size` = 96 | 0.1.0 | ui, share, qr, renderBadgeArea |
| [SocialLinks](#sociallinks) | 社交外链行：一排可点击的平台入口（微博 / 知乎 / GitHub …）。 | `links` = []<br/>`showLabel` = true<br/>`align` = 'left' | 0.1.0 | social, links, renderBioArea |
| [StatRow](#statrow) | 数据行：把关注 / 粉丝 / 获赞 / 作品等指标横排展示，每项显示「值 + 标签」。数据源为 config.items 或 props.stats。 | `items` = context.stats<br/>`direction` = row<br/>`divider` = true<br/>`onStatClick` = - | 0.1.0 | ui, stats, 数据 |
| [TabSync](#tabsync) | 页签系统：渲染页签栏（underline / pill / segmented 三种样式），点击切换 activeTab，并联动内容区重渲染。切换时默认把容器滚到顶部。 | `tabs` = -<br/>`variant` = underline<br/>`sticky` = false<br/>`scrollTopOnChange` = true<br/>`onChange` = - | 0.1.0 | ui, tab, 页签 |
| [TagList](#taglist) | 兴趣 / 标签行：一排圆角小标签。 | `tags` = []<br/>`align` = 'left' | 0.1.0 | tags, interest, renderBioArea |
| [VerifyBadge](#verifybadge) | 认证徽标：个人 / 机构两种认证对勾（内联 SVG，无外部资源），浮于头图右上角。verified 为 false 时不渲染。 | `verified` = props.verified<br/>`type` = props.badgeType<br/>`label` = 按 type 给「认证」/「机构认证」<br/>`showLabel` = true | 0.1.0 | ui, badge, 认证 |
| [WorksGrid](#worksgrid) | 作品网格：随 activeTab 联动的内容区插件。 | `items` = []<br/>`columns` = 3<br/>`gap` = 10<br/>`tab` = -<br/>`title` = -<br/>`empty` = 暂无作品 | 0.1.0 | content, grid, works, renderContentArea |

## 插件能力明细

### AchievementWall

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `AchievementItem[]` | `[]` | 成就列表，每项含 id / title / 可选 desc / glyph / color |
| `columns` | `number` | `4` | 网格列数 |
| `gap` | `number` | `10` | 卡片间距（px） |
| `tab` | `string` | `-` | 仅在某个页签激活时显示（与 TabSync 联动）；不填则始终显示 |
| `title` | `ReactNode` | `-` | 分组标题 |
| `empty` | `ReactNode` | `暂无成就` | 空列表占位文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderContentArea` | 每次渲染，内容区槽位（随 activeTab 联动） | 插件贡献的内容面板；有内容插件时覆盖 children |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ActivitySummary

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `lastActive` | `string` | `-` | 最近活跃描述，如「2 小时前」 |
| `postsThisMonth` | `number` | `-` | 本月发布篇数 |
| `totalViews` | `string` | `-` | 总阅读量描述，如「120w」 |
| `showIcon` | `boolean` | `true` | 是否显示时钟图标字 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBioArea` | 每次渲染，简介区槽位（头图与数据行之间） | 昵称、签名、所在地、加入时间 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### BannerSlot

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `cover` | `string` | `` | 封面图 URL；与 gradient 至少其一 |
| `gradient` | `[string, string]` | `["#6a11cb", "#2575fc"]` | 渐变起止色，无 cover 时作背景 |
| `avatar` | `string` | `` | 头像 URL，浮于头图左下 |
| `avatarAlt` | `string` | `头像` | 头像无障碍描述 |
| `avatarFallback` | `ReactNode` | `人形占位` | 头像加载失败 / 缺失时的兜底内容 |
| `avatarSize` | `number` | `64` | 头像直径（px） |
| `avatarRound` | `boolean` | `true` | 头像是否圆形 |
| `height` | `number` | `160` | 头图区高度（px） |
| `overlay` | `ReactNode` | `context.banner` | 叠加文案，缺省用 props.banner |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBannerArea` | 每次渲染，头图区槽位 | 封面图、渐变背景、头像浮层位 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### BioSlot

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `ReactNode` | `-` | 昵称（头图已用 overlay 显示时留空，避免重复） |
| `subtitle` | `ReactNode` | `-` | 副标题 / 职业，显示在昵称下方小字 |
| `bio` | `ReactNode` | `-` | 个性签名 / 一句话简介 |
| `location` | `string` | `-` | 所在地 |
| `joinDate` | `string` | `-` | 加入时间，如「2021 加入」 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBioArea` | 每次渲染，简介区槽位（头图与数据行之间） | 昵称、签名、所在地、加入时间 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ContactCard

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `email` | `string` | `-` | 邮箱，渲染为 mailto: 链接 |
| `phone` | `string` | `-` | 电话，渲染为 tel: 链接 |
| `site` | `string` | `-` | 官网，外链带 rel 防钓鱼 |
| `address` | `string` | `-` | 地址，纯文本不渲染为链接 |
| `showIcon` | `boolean` | `true` | 是否显示左侧图标字 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBioArea` | 每次渲染，简介区槽位（头图与数据行之间） | 昵称、签名、所在地、加入时间 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FollowEcho

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `state` | `"none" \| "following" \| "mutual"` | `props.followState` | 强制关注态，覆盖 props.followState |
| `labels` | `Partial<Record<FollowState, ReactNode>>` | `{ none: 关注, following: 已关注, mutual: 互相关注 }` | 三态文案覆盖 |
| `size` | `"sm" \| "md"` | `md` | 按钮尺寸 |
| `onFollow` | `function => void \| Promise<void \| { error }>` | `-` | 点击切换后的回调；可返回 Promise，pending 时禁用按钮，失败（reject 或 { error }）时回滚乐观态并提示错误 |
| `onMutual` | `function` | `-` | 关系变为 mutual 时的回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onPropsChange` | 资料 props 变化后 | 按新旧资料差分刷新派生状态 |
| `renderFollowArea` | 每次渲染，关注回显区槽位 | 关注 / 已关注 / 互相关注的按钮与文案 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LiveStatus

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `status` | `"online" \| "away" \| "busy" \| "offline" \| "live"` | `online` | 状态类型，决定圆点颜色与文案 |
| `liveTitle` | `string` | `-` | status=live 时的直播标题 |
| `showLabel` | `boolean` | `true` | 是否展示文案（仅圆点为 false） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBioArea` | 每次渲染，简介区槽位（头图与数据行之间） | 昵称、签名、所在地、加入时间 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MembershipBadge

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3` | `1` | 会员等级，决定配色与默认文案 |
| `label` | `ReactNode` | `-` | 覆盖默认文案；缺省按 level 给 VIP{n} |
| `showLabel` | `boolean` | `true` | 是否展示文案（仅图标时为 false） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBadgeArea` | 每次渲染，认证徽标区（默认头图右上角） | 认证标识、等级徽章、状态角标 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MessageButton

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `"sm" \| "md"` | `md` | 按钮尺寸 |
| `label` | `ReactNode` | `私信` | 按钮文案 |
| `onMessage` | `function` | `-` | 点击回调，参数为领域上下文 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFollowArea` | 每次渲染，关注回显区槽位 | 关注 / 已关注 / 互相关注的按钮与文案 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### QRShare

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | `props.data.homeUrl` | 要分享的主页地址；缺省读 props.data.homeUrl，都没有则不渲染分享按钮 |
| `buttonLabel` | `ReactNode` | `分享` | 按钮文案 |
| `size` | `number` | `96` | 二维码占位区边长（px） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBadgeArea` | 每次渲染，认证徽标区（默认头图右上角） | 认证标识、等级徽章、状态角标 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SocialLinks

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `links` | `SocialLink[]` | `[]` | 外链列表，每项含 platform / href / 可选 label / glyph |
| `showLabel` | `boolean` | `true` | 是否显示文案（仅图标字时为 false） |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 整组对齐方式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBioArea` | 每次渲染，简介区槽位（头图与数据行之间） | 昵称、签名、所在地、加入时间 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StatRow

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `StatItem[]` | `context.stats` | 显式指标；缺省读 props.stats |
| `direction` | `"row" \| "column"` | `row` | 排布方向 |
| `divider` | `boolean` | `true` | row 模式下项间分隔线 |
| `onStatClick` | `function` | `-` | 点击回调，可在此 setActiveTab 联动页签 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderStatRow` | 每次渲染，数据行槽位 | 关注 / 粉丝 / 获赞 / 作品等指标 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### TabSync

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tabs` | `TabItem[]` | `-` | 页签定义 { id, label, icon? }，至少一项 |
| `variant` | `"underline" \| "pill" \| "segmented"` | `underline` | 样式变体 |
| `sticky` | `boolean` | `false` | 是否吸顶 |
| `scrollTopOnChange` | `boolean` | `true` | 切换时容器滚到顶部 |
| `onChange` | `function` | `-` | 切换回调 (id, oldId) |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onTabChange` | activeTab 变化后（回传 newTab / oldTab） | 切页副作用：懒加载、埋点、滚动复位 |
| `renderTabBar` | 每次渲染，页签栏槽位 | 页签按钮；点击经 ctx.setActiveTab 驱动内容区联动 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setActiveTab` | `ctx.setActiveTab(id: string \| null): void` | 切换页签并触发内容区联动（写入内核 state） |

### TagList

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tags` | `string[]` | `[]` | 标签文本列表 |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 整组对齐方式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBioArea` | 每次渲染，简介区槽位（头图与数据行之间） | 昵称、签名、所在地、加入时间 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### VerifyBadge

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `verified` | `boolean` | `props.verified` | 强制认证态，覆盖 props.verified |
| `type` | `"personal" \| "institution"` | `props.badgeType` | 认证类型，改变徽标颜色与默认文字 |
| `label` | `ReactNode` | `按 type 给「认证」/「机构认证」` | 徽标旁文字 |
| `showLabel` | `boolean` | `true` | 是否展示文字 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBadgeArea` | 每次渲染，认证徽标区（默认头图右上角） | 认证标识、等级徽章、状态角标 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### WorksGrid

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `WorkItem[]` | `[]` | 作品列表，每项含 id / title / 可选 cover / coverColor / meta |
| `columns` | `number` | `3` | 网格列数 |
| `gap` | `number` | `10` | 卡片间距（px） |
| `tab` | `string` | `-` | 仅在某个页签激活时显示（与 TabSync 联动）；不填则始终显示 |
| `title` | `ReactNode` | `-` | 网格上方的分组标题 |
| `empty` | `ReactNode` | `暂无作品` | 空列表占位文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderContentArea` | 每次渲染，内容区槽位（随 activeTab 联动） | 插件贡献的内容面板；有内容插件时覆盖 children |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出 + `Object.assign(create, { meta: doc })`）；
3. 跑 `pnpm docs:plugins` 重新生成 `docs/plugins.md` 本表和文档站导航；
4. `README.md` 为手写（含 npm 专属内容），新增插件后请同步更新 README 的「插件目录速览」与计数。
