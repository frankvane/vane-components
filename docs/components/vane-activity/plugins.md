# 营销活动 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [ActivityHeaderPlugin](#activityheaderplugin) | 活动头部横幅：标题 + 副标题 + 标签 + 状态徽章（按 data.endTime 派生「剩 N 天 / 今日截止 / 已结束」）。 | `title` = data.title<br/>`subtitle` = —<br/>`tags` = []<br/>`badge` = 按 endTime 派生<br/>`icon` = —<br/>`align` = left | 0.1.0 | ui, 头部, 横幅 |
| [AnnouncementPlugin](#announcementplugin) | 活动公告条：横向滚动播报多条公告，纯 CSS 跑马灯（无定时器），悬停暂停、减动效偏好下静止。 | `items` = []<br/>`label` = "公告"<br/>`icon` = "📢"<br/>`speedSec` = 16<br/>`order` = 0 | 0.1.0 | ui, 头部, 公告, 跑马灯 |
| [CheckinCalendarPlugin](#checkincalendarplugin) | 签到日历：N 个格子展示已签 / 今日待签 / 未开始三态，附连续天数与签到按钮，点按钮走 onCheckin 或本地乐观 +1。 | `title` = "连续签到"<br/>`days` = 7<br/>`done` = 0<br/>`todayIndex` = done<br/>`onCheckin` = undefined<br/>`showButton` = true<br/>`order` = 0 | 0.1.0 | ui, 进度, 签到, 日历 |
| [ClaimToastPlugin](#claimtoastplugin) | 领取成功轻提示：监听 claimedIds 新增项，在浮层右下角（或顶部居中）淡入「已领取：xx」，到时自动消失。 | `durationMs` = 2400<br/>`max` = 3<br/>`position` = "bottom-right"<br/>`message` = (t) => `已领取：${t}` | 0.1.0 | ui, 反馈, 浮层 |
| [ConfettiPlugin](#confettiplugin) | 庆祝彩纸：进度达成阈值（默认 100%）时容器内下落彩纸动画；与 ProgressFx 文字浮层同槽共存。 | `count` = 28<br/>`durationSec` = 2.6<br/>`threshold` = 1 | 0.1.0 | ui, 庆祝, 浮层, 动画 |
| [CountdownTimerPlugin](#countdowntimerplugin) | 活动倒计时：在进度区下方渲染「距活动结束 x天HH:MM:SS」，每秒自走；与 ProgressFx 同槽共存。 | `endTime` = -<br/>`label` = 距活动结束<br/>`urgentMs` = 3600000<br/>`order` = 0 | 0.1.0 | ui, 倒计时, 进度区 |
| [CouponStackPlugin](#couponstackplugin) | 券堆叠：把奖励渲染成一摞错位的票券卡（RewardClaim 的变体渲染），同槽位独占。 | `stackOffset` = 6<br/>`claimLabel` = 领取<br/>`claimedLabel` = 已领取<br/>`lockedLabel` = 未解锁 | 0.1.0 | ui, 奖励, 变体, 独占 |
| [JackpotPlugin](#jackpotplugin) | 幸运抽奖九宫格：8 个奖励格围绕中心按钮，点击后高亮逐格推进并逐渐减速，停在随机中奖格；次数用完自动禁用。生产建议用 `drawResult` 由服务端决定结果。 | `title` = "幸运抽奖"<br/>`prizes` = 8 个内置奖励<br/>`times` = 3<br/>`remainingTimes` = undefined<br/>`drawResult` = undefined<br/>`onDraw` = undefined<br/>`order` = 0 | 0.1.0 | ui, 玩法, 抽奖, 九宫格, 底部 |
| [LeaderboardPlugin](#leaderboardplugin) | 好友榜：按 score 降序取前 N 名，第一名强调橙名次牌，isMe 行浅橙底高亮；自己不在前 N 时底部补真实名次。 | `title` = "好友榜"<br/>`topN` = 3<br/>`unit` = "分"<br/>`highlightMe` = true<br/>`emptyText` = "暂无排行数据"<br/>`order` = 0 | 0.1.0 | ui, 底部, 社交, 榜单 |
| [MilestoneBarPlugin](#milestonebarplugin) | 里程碑进度：把奖励阈值映射为轨道节点（已领取实心绿 / 可领警示橙 / 未达标灰），展示离下一档的空间距离。 | `height` = 6<br/>`dotSize` = 18<br/>`order` = 0 | 0.1.0 | ui, 里程碑, 进度区 |
| [ProgressFxPlugin](#progressfxplugin) | 进度特效：顶部进度条 fill + 百分比数字；进度达成 100% 时浮层庆祝条。 | `height` = 8<br/>`order` = 0 | 0.1.0 | ui, 进度, 特效 |
| [ProgressRingPlugin](#progressringplugin) | 环形进度：SVG 双环 + 中心百分比 + 右侧「已完成 x/y 项 / 距下一档还差 N%」文案。 | `size` = 104<br/>`strokeWidth` = 10<br/>`label` = "总进度"<br/>`showCaption` = true<br/>`color` = "#cf4407"<br/>`order` = 0 | 0.1.0 | ui, 进度区, 环形 |
| [RedeemCodePlugin](#redeemcodeplugin) | 兑换码：输入框 + 本地校验（非空 / 长度 / 前缀）+ 成功或失败回执，回车即可提交，结果区 aria-live 播报。 | `title` = "兑换码"<br/>`prefix` = undefined<br/>`minLength` = 8<br/>`placeholder` = "如 VANE-8888"<br/>`successText` = "兑换成功，奖励已入账"<br/>`onRedeem` = undefined<br/>`order` = 0 | 0.1.0 | ui, 奖励, 兑换码, 表单 |
| [RewardClaimPlugin](#rewardclaimplugin) | 奖励领取：渲染奖励行，按派生状态展示按钮（可领/已领/锁定），点击调 claim。 | `claimedLabel` = 已领取<br/>`order` = 0 | 0.1.0 | ui, 奖励, 领取 |
| [RuleExpandPlugin](#ruleexpandplugin) | 规则折叠：渲染「活动规则」可折叠面板，折叠态按行数截断，同步 aria-expanded。 | `collapsedLines` = 3 | 0.1.0 | ui, 规则, 折叠 |
| [RuleModalPlugin](#rulemodalplugin) | 弹窗版规则：规则区只放触发按钮，点击弹出模态窗展示完整规则（RuleExpand 的变体渲染），同槽位独占。 | `triggerLabel` = 活动规则<br/>`title` = 活动规则<br/>`maxWidth` = 420 | 0.1.0 | ui, 规则, 弹窗, 独占 |
| [ShareBoostPlugin](#shareboostplugin) | 好友助力：分段名额进度 + 助力头像堆（超出折叠 +N）+「还差 N 人」+ 邀请按钮，落在活动底部。 | `title` = "邀请好友助力"<br/>`total` = 3<br/>`used` = 0<br/>`onInvite` = —<br/>`maxAvatars` = 5<br/>`order` = 0 | 0.1.0 | ui, 底部, 社交 |
| [TaskListPlugin](#tasklistplugin) | 任务清单：渲染活动任务列表，展示标题/描述/进度与状态，含「去完成」动作按钮。 | `showProgress` = true<br/>`doneLabel` = 已完成<br/>`order` = 0 | 0.1.0 | ui, 任务, 列表 |
| [TaskTabsPlugin](#tasktabsplugin) | 分组任务清单：页签切换（每日 / 成长 / 邀请…），每个页签带完成度计数，组内沿用任务行样式与「去完成」动作。 | `tabs` = []<br/>`defaultTab` = 第一个页签<br/>`showProgress` = true<br/>`doneLabel` = "已完成"<br/>`emptyText` = "该分组暂无任务"<br/>`order` = 0 | 0.1.0 | ui, 任务, 分组, 页签, 独占槽位 |

## 插件能力明细

### ActivityHeaderPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `data.title` | 主标题；不传则读 data.title，两者都没有时不渲染 |
| `subtitle` | `string` | `—` | 副标题，一句话说明活动卖点（13px / #5d636a） |
| `tags` | `string[]` | `[]` | 标签行（如「限时」「新人专享」），浅橙 chip 逐个渲染 |
| `badge` | `string` | `按 endTime 派生` | 状态徽章文案；显式传入时优先，传空串则不显示徽章 |
| `icon` | `string` | `—` | 标题前图标（emoji 或单字符），已标 aria-hidden 不干扰读屏 |
| `align` | `"left" | "center"` | `left` | 内容对齐方式，center 适合抽奖 / 节日大促类页头 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染；title 与 subtitle 同时为空时返回 null 让出槽位 | 在 Core 最顶部渲染 &lt;header&gt; 横幅，读取 ctx.data.title 与 ctx.data.endTime |

**方法 Methods**

纯展示，不调用任何上下文方法；徽章按 Date.now() 与 data.endTime 的差值现算，不持有计时器（秒级倒计时请叠加 CountdownTimerPlugin）。

### AnnouncementPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `string[]` | `[]` | 公告条目；data.announcements 非空时以数据为准，config 只在无数据时兜底 |
| `label` | `string` | `公告` | 左侧标签文案 |
| `icon` | `string` | `📢` | 标签前的图标（emoji 或字符） |
| `speedSec` | `number` | `16` | 滚动一轮的秒数，越大越慢 |
| `order` | `number` | `0` | 同槽位排序键：与 ActivityHeaderPlugin 同在 renderHeader 时调上下顺序 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染；公告条目为空时返回 null（该区块不进产物） | 在头部槽渲染公告条；CSS 动画循环，不注册任何定时器，因此无事件回调 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `ctx.data.announcements` | `string[] | undefined` | 读取公告数据源；非空时优先于 config.items |

### CheckinCalendarPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `连续签到` | 卡片标题 |
| `days` | `number` | `7` | 共几天；data.checkin.days 存在时以数据为准 |
| `done` | `number` | `0` | 已完成天数；data.checkin.done 存在时以数据为准 |
| `todayIndex` | `number` | `done` | 今天对应的格子下标（0-based），默认等于 done 即「今天还没签」 |
| `onCheckin` | `() => void` | `undefined` | 点「今日签到」的回调；不传则组件内乐观 +1，传了由业务侧回写 data.checkin.done |
| `showButton` | `boolean` | `true` | 是否显示签到按钮（纯展示场景可关掉） |
| `order` | `number` | `0` | 同槽位排序键：与 ProgressFx / ProgressRing / MilestoneBar 同在 renderProgress 时定上下 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onCheckin` | 点击「今日签到」且今天尚未签到、本轮未签满时 | 通知业务侧落库；插件在收到回调前不改本地态，业务侧需回写 data.checkin.done 才会推进格子 |
| `renderProgress` | 每次渲染 | 在顶部进度槽渲染签到日历；showButton 为 false 时只渲染格子 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `ctx.data.checkin` | `{ days?: number; done: number; todayIndex?: number }` | 读取签到态；缺省时逐字段回退到 config |

### ClaimToastPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `durationMs` | `number` | `2400` | 单条 toast 停留时长（毫秒） |
| `max` | `number` | `3` | 同屏最多条数，超出丢弃最早的 |
| `position` | `"bottom-right" | "top-center"` | `bottom-right` | 出现位置；bottom-right 适合移动端底部拇指区，top-center 适合桌面端 |
| `message` | `(title: string) => string` | `(t) => `已领取：${t}`` | 自定义文案函数，入参是奖励标题 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染；队列为空时返回 null（不占位） | 在浮层槽挂载 ClaimToastLayer，内部只渲染当前待显示的 toast 队列 |
| `claimedIds 变化` | context.claimedIds 内容指纹（join("|")）发生变化时 | 用 diff 找出新增的奖励 id，逐条生成 toast；首屏已有的领取记录不补弹 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `ctx.claimedIds` | `string[]` | 读取已领取奖励 id；作为 change source 触发 toast |
| `ctx.rewards` | `ActivityRewardWithStatus[]` | 按 id 查奖励标题，用于拼文案 |

### ConfettiPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | `28` | 彩纸数量 |
| `durationSec` | `number` | `2.6` | 单轮下落基准时长（秒，每片带随机扰动） |
| `threshold` | `number` | `1` | 触发阈值（ctx.progress ≥ threshold 时庆祝） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染；progress 达阈值时 | 渲染彩纸层（absolute + pointerEvents:none，不挡交互）；未达阈值返回 null |

**方法 Methods**

只读取 ctx.progress，不调用任何上下文方法；动画用 CSS keyframes（渲染时注入一次 &lt;style&gt;）。

### CountdownTimerPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `endTime` | `string | number` | `-` | 截止时间（ISO 或时间戳）；不传则回退读 data.endTime，两者皆无则不渲染 |
| `label` | `string` | `距活动结束` | 倒计时前缀文案 |
| `urgentMs` | `number` | `3600000` | 剩余不足该毫秒数时进入紧急态（文字变警示色 #cf4407） |
| `order` | `number` | `0` | 同槽位排序键（升序靠前）：默认排在 ProgressFx 之后（priority 更低） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderProgress` | 每次渲染；截止时间可解析时 | 在进度槽位追加倒计时行；时间为空或非法时返回 null 让出槽位 |

**方法 Methods**

计时状态在组件内部自持（setInterval），不调用任何上下文方法，也不写内核 state。

### CouponStackPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `stackOffset` | `number` | `6` | 相邻券卡的横向错位偏移（px） |
| `claimLabel` | `string` | `领取` | 可领态按钮文案 |
| `claimedLabel` | `string` | `已领取` | 已领取态文案 |
| `lockedLabel` | `string` | `未解锁` | 锁定态文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderRewards` | 每次渲染；ctx.rewards 非空时 | 渲染票券卡列表；无奖励时返回 null |
| `ctx.claim` | 点击「领取」按钮 | 领取对应奖励（内部态更新 + onClaim 回调），卡片随即变「已领取」 |

**方法 Methods**

领取走 ctx.claim(rewardId)（内核统一入口），自身不持有领取状态。

### JackpotPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `幸运抽奖` | 卡片标题 |
| `prizes` | `JackpotPrize[]` | `8 个内置奖励` | 奖池，每项 { id, label, icon? }；固定 8 格，不足补「谢谢参与」，超出取前 8 |
| `times` | `number` | `3` | 未传 `remainingTimes` 时的剩余次数初值；每次点击按 `drawResult` 返回或本地 -1，归零后禁用 |
| `remainingTimes` | `number` | `undefined` | 受控剩余次数；传入后组件不自行递减，由业务侧回写 |
| `drawResult` | `() => JackpotDrawResult \| Promise<JackpotDrawResult>` | `undefined` | 服务端权威抽奖：返回 `{ index, remaining? }`；传入后不再使用本地 `Math.random`，请求期间按钮禁用 |
| `onDraw` | `(prize: JackpotPrize, index: number) => void` | `undefined` | 中奖通知（动画结束后触发）；仅通知，不负责扣次数，生产应由服务端发奖 |
| `order` | `number` | `0` | 同槽位排序键：与助力条 / 榜单同在 renderFooter 时定上下 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onDraw` | 一次抽奖动画跑完（约 1.5–2.5 秒）并确定中奖格后 | 回传中奖奖励对象与其在奖池中的下标，供业务侧发奖 / 埋点 |
| `renderFooter` | 每次渲染 | 在底部槽渲染抽奖卡片（九宫格 + 按钮 + 结果文案） |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `内部 draw()` | `() => Promise<void>` | 开始一轮抽取；drawing 中或次数为 0 时直接返回（防连点）；`drawResult` 失败会展示错误并恢复按钮 |

### LeaderboardPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `好友榜` | 榜单标题 |
| `topN` | `number` | `3` | 展示前几名 |
| `unit` | `string` | `分` | 分数单位后缀 |
| `highlightMe` | `boolean` | `true` | 是否高亮 isMe 行并在名字后加「我」标签 |
| `emptyText` | `string` | `暂无排行数据` | data.leaderboard 为空时的占位文案 |
| `order` | `number` | `0` | 同槽位排序键：与 ShareBoostPlugin 同在 renderFooter 时决定上下顺序 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染；data.leaderboard 为空时渲染占位卡片而非返回 null | 在底部社交槽渲染榜单（前 N 名 + 可选「我的名次」分隔行） |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `ctx.data.leaderboard` | `ActivityLeaderboardEntry[]` | 读取榜单原始数据（id / name / score / avatar? / isMe?），插件内排序后切片 |

### MilestoneBarPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `height` | `number` | `6` | 轨道高度（px） |
| `dotSize` | `number` | `18` | 里程碑圆点直径（px） |
| `order` | `number` | `0` | 同槽位排序键（升序靠前）：与 ProgressFx / ProgressRing 共存时决定上下位置 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderProgress` | 每次渲染；ctx.rewards 非空时 | 在进度槽位渲染带节点的轨道；无奖励时返回 null 让出槽位 |

**方法 Methods**

只读取 ctx.progress 与 ctx.rewards（含派生状态），不调用任何上下文方法。

### ProgressFxPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `height` | `number` | `8` | 进度条高度（px），圆角随高度自动取 height / 2 |
| `order` | `number` | `0` | 同槽位排序键（升序靠前）：与 ProgressRing / MilestoneBar / CountdownTimer 共存时调整上下顺序 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderProgress` | 每次渲染；进度槽位无更高 order 的插件接管时 | 输出「进度条 + 百分比数字」，百分比 = round(ctx.progress × 100) |
| `renderOverlay` | ctx.progress &gt;= 1（全部任务完成） | 在浮层渲染「🎉 进度达成 100%」庆祝条（absolute + pointerEvents:none，不挡交互）；未达成返回 null |

**方法 Methods**

纯展示：只读取 ctx.progress（0..1），不调用任何上下文方法，也不触发回调。

### ProgressRingPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `number` | `104` | 圆环直径（px），同时决定 svg 的 viewBox 边长 |
| `strokeWidth` | `number` | `10` | 环宽（px），半径 = (size - strokeWidth) / 2 |
| `label` | `string` | `总进度` | 环右侧标题文案 |
| `showCaption` | `boolean` | `true` | 是否显示「已完成 x/y 项」与「距下一档还差 N%」两行明细 |
| `color` | `string` | `#cf4407` | 进度环颜色（轨道固定 rgba(128,128,128,0.18)） |
| `order` | `number` | `0` | 同槽位排序键（由内核 config.order 消费）：升序靠前，用于把环放在进度条上/下方 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderProgress` | 每次渲染（进度、任务、奖励任一变化） | 在进度槽渲染环形进度 + 文案；不返回 null，永远是常驻区块 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `ctx.progress` | `number // 0..1` | 读取总体加权进度（由 computeProgress 派生），插件内再 clamp 到 0..1 防越界 |
| `ctx.tasks / ctx.rewards` | `ActivityTask[] / ActivityRewardWithStatus[]` | 只读派生数据：tasks 用于统计完成项数，rewards 用于计算距下一档的百分比 |

### RedeemCodePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `兑换码` | 卡片标题 |
| `prefix` | `string` | `undefined` | 必填前缀（转大写比较，如 "VANE"）；不传则不校验前缀 |
| `minLength` | `number` | `8` | 兑换码最短长度 |
| `placeholder` | `string` | `如 VANE-8888` | 输入框占位文案 |
| `successText` | `string` | `兑换成功，奖励已入账` | 校验通过后的成功文案 |
| `onRedeem` | `(code: string) => boolean | void` | `undefined` | 兑换回调，入参是 trim + 转大写后的码；返回 false 表示无效码，组件展示失败文案 |
| `order` | `number` | `0` | 同槽位排序键：与 RewardClaimPlugin 同在 renderRewards 时定上下 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onRedeem` | 表单提交（点「兑换」或回车）且本地校验全部通过后 | 把规范化后的兑换码交给业务侧核销；返回 false 则视为无效，界面转失败态 |
| `renderRewards` | 每次渲染 | 在奖励槽渲染兑换卡 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `内部 handleSubmit(event)` | `(event: React.FormEvent) => void` | 阻止表单默认提交 → trim/大写 → 空值 / 长度 / 前缀三重校验 → 调 onRedeem |

### RewardClaimPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `claimedLabel` | `string` | `已领取` | 已领取态按钮文案 |
| `order` | `number` | `0` | 同槽位排序键：与 RedeemCodePlugin 同在 renderRewards 时定上下 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderRewards` | 每次渲染；奖励槽位无更高 order 的插件接管时 | 输出奖励行：可领（实心橙按钮）/ 已领（绿字禁用）/ 未解锁（灰字禁用） |
| `onClaim` | 点击「领取」按钮（仅 claimable 态可点） | 先走 ctx.claim(rewardId)；非受控直接更新内部态，受控则等待宿主回写 claimedRewardIds |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `claim` | `ctx.claim(rewardId: string): void` | 领取指定奖励：仅 claimable 生效，未知 id / locked / claimed 直接忽略并告警；非受控写入内核 claimedIds，受控只调 onClaim |

### RuleExpandPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `collapsedLines` | `number` | `3` | 折叠态最大展示行数（-webkit-line-clamp） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderRules` | 每次渲染；规则槽位无更高 order 的插件接管时 | 输出「活动规则」折叠面板；data.rules 为空时返回 null |

**方法 Methods**

展开/收起用组件本地 useState，不写回 ctx，也不调用任何上下文方法。

### RuleModalPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `triggerLabel` | `string` | `活动规则` | 触发按钮文案 |
| `title` | `string` | `活动规则` | 弹窗标题 |
| `maxWidth` | `number` | `420` | 弹窗最大宽度（px） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderRules` | 每次渲染；data.rules 非空时 | 渲染触发按钮；无规则时返回 null |
| `open/close` | 点击按钮 / 点击遮罩或 ✕ | 弹窗开合为插件内部 useState，aria-haspopup / aria-expanded 同步 |

**方法 Methods**

开合状态在插件内部自持，不调用任何上下文方法。

### ShareBoostPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `邀请好友助力` | 区块标题 |
| `total` | `number` | `3` | 未传 data.share 时的默认可助力总次数（优先级低于 data.share.total） |
| `used` | `number` | `0` | 未传 data.share 时的默认已用次数（优先级低于 data.share.used） |
| `onInvite` | `() => void` | `—` | 点「邀请助力」回调；传入时组件不自增，由业务侧回写 data.share.used 驱动 |
| `maxAvatars` | `number` | `5` | 头像最多显示几个，超出折叠为 +N |
| `order` | `number` | `0` | 同槽位排序键：与 LeaderboardPlugin 同在 renderFooter 时用它决定上下顺序 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染；恒定渲染（无数据时用 config 兜底） | 在底部社交槽渲染助力条 |
| `onInvite` | 点击「邀请助力」且未满额时 | 冒泡给消费方；未传则组件内乐观自增 used |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `ctx.data.share` | `{ total: number; used: number; helpers?: { id, name, avatar? }[] }` | 读取助力真值：total 决定分段数、used 决定点亮段、helpers 渲染头像堆 |

### TaskListPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showProgress` | `boolean` | `true` | 是否展示每个未完成任务的进度条 |
| `doneLabel` | `string` | `已完成` | 完成态文案（替代默认的「已完成」） |
| `order` | `number` | `0` | 同槽位排序键（本插件独占 renderTasks，一般用不到） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderTasks` | 每次渲染；任务槽位无更高 order 的插件接管时 | 输出任务清单；ctx.tasks 为空时返回 null，槽位留空 |
| `onTaskAction` | 点击任务动作按钮（status !== completed 且配了 actionLabel） | 透传 ActivityCore 的 onTaskAction(taskId)，由消费方决定跳转/埋点 |

**方法 Methods**

只读取 ctx.tasks 与 ctx.props.onTaskAction，不调用任何上下文方法。

### TaskTabsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tabs` | `ActivityTaskGroup[]` | `[]` | 页签定义（key / label / icon?）；data.taskGroups 非空时以数据为准 |
| `defaultTab` | `string` | `第一个页签` | 默认选中的页签 key |
| `showProgress` | `boolean` | `true` | 是否展示未完成任务的进度条 |
| `doneLabel` | `string` | `已完成` | 完成态文案 |
| `emptyText` | `string` | `该分组暂无任务` | 页签下无任务时的占位文案（不返回 null，避免页签跳动） |
| `order` | `number` | `0` | 同槽位排序键（本插件独占 renderTasks，一般用不到） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onTaskAction` | 点击任务行的动作按钮（task.actionLabel 存在且未完成） | 透传 ctx.props.onTaskAction(taskId)，由业务侧跳转或标记完成 |
| `renderTasks` | 每次渲染；任务为空时返回 null | 在任务槽渲染页签 + 当前分组任务行 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `ctx.tasks` | `ActivityTask[]` | 读取全量任务（含 group / status / progress），按当前页签过滤后渲染 |

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
