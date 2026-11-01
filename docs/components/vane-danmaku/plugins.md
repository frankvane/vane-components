# 弹幕 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AtMentionPlugin](./AtMentionPlugin) | @提及高亮：识别 @用户名 写入 renderHint.rich 带色分段，与 KeywordHighlight 共用分段机制。 | `color` = "#4ea1ff"<br/>`pattern` = @[\w\u4e00-\u9fa5]+ | 0.1.0 | mention, highlight, data |
| [AuditLogPlugin](./AuditLogPlugin) | 弹幕审计：不增删弹幕，对每条触发 onLog 回调（审核/风控/落库），可选经 bus 广播 danmaku:audit。 | `onLog` = undefined<br/>`emit` = false | 0.1.0 | audit, log, data |
| [CmdParsePlugin](./CmdParsePlugin) | 互动指令：/clear、#lottery 等弹幕在 transformData 阶段被识别、从渲染流移除，并经 bus 事件触发业务动作。 | `prefixes` = ["/", "#"]<br/>`commands` = { clear, lottery } | 0.1.0 | command, interaction, data |
| [ColorPolicyPlugin](./ColorPolicyPlugin) | 角色配色策略：未显式指定 color 时按角色着色——管理员红、高等级金，普通保持白。放在流水线靠后避免覆盖业务配色。 | `adminColor` = "#ff4d4f"<br/>`vipColor` = "#ffd54a"<br/>`vipLevel` = 18 | 0.1.0 | color, policy, data |
| [CommandInputPlugin](./CommandInputPlugin) | 弹幕/指令输入框（UI 面）：提交经 bus 广播 danmaku:send {text}，由消费方追加弹幕或交给 CmdParse 解析指令。 | `placeholder` = 发条弹幕 / 指令（/clear） | 0.1.0 | ui, input, command |
| [DedupPlugin](./DedupPlugin) | 弹幕去重：同一用户+相同文案在 window 秒内重复出现只保留首条，缓解刷屏。 | `window` = 5 | 0.1.0 | dedup, cleanup, data |
| [EmojiRenderPlugin](./EmojiRenderPlugin) | 表情短码转义：把 :shortcode:（如 :rocket:）替换为 unicode 表情，内核按普通文字绘制。 | `map` = {...内置常用表} | 0.1.0 | emoji, text, data |
| [FanBadgePlugin](./FanBadgePlugin) | 粉丝牌：按 userId 富化 meta.fanBadge，canvas 内核据此绘制牌底块 + 白字。插件只写数据，绝不直绘。 | `badges` = {}<br/>`defaultColor` = "#ff7a29" | 0.1.0 | badge, enrich, data |
| [FilterTogglePlugin](./FilterTogglePlugin) | 过滤开关条（UI 面）：一排过滤项 chip，点击经 bus 广播 danmaku:filter {key,enabled}，由消费方重建对应数据面插件。 | `defaults` = 全部开启 | 0.1.0 | ui, filter, toolbar |
| [GiftComboPlugin](./GiftComboPlugin) | 礼物连击聚合：同用户相同「基础词 xN」紧邻出现合并为一条并累加连击数，内核末尾绘制 xN 角标。 | `pattern` = ^(.*?)\s*x(\d+)$ | 0.1.0 | gift, combo, data |
| [KeywordBlockPlugin](./KeywordBlockPlugin) | 关键词硬屏蔽：命中词直接从弹幕流删除（区别于 SensitiveFilter 打码保留），用于违禁/竞品词。 | `words` = []<br/>`mode` = "contains" | 0.1.0 | block, filter, data |
| [KeywordHighlightPlugin](./KeywordHighlightPlugin) | 关键词高亮：命中词写入 renderHint.rich 带色分段，内核按段着色，其余保持原色。 | `keywords` = []<br/>`color` = "#ff7a29" | 0.1.0 | highlight, keyword, data |
| [LangFilterPlugin](./LangFilterPlugin) | 语种过滤：弹幕须至少命中 allow 中一种字符体系才保留；blockUnknown 时纯符号刷屏直接丢弃。 | `allow` = ["cjk","latin"]<br/>`blockUnknown` = true | 0.1.0 | lang, filter, data |
| [PinnedTopPlugin](./PinnedTopPlugin) | 高赞置顶：高等级弹幕标记 pinned + ring，内核钉在顶部带、居中停留并加高赞环高亮，不随风滚动。 | `minLevel` = 18 | 0.1.0 | pin, highlight, data |
| [RateLimitPlugin](./RateLimitPlugin) | 单用户限流：window 秒内超过 max 条的同用户弹幕被丢弃，防刷屏压垮轨道。 | `max` = 3<br/>`window` = 10 | 0.1.0 | ratelimit, flood, data |
| [SafeZonePlugin](./SafeZonePlugin) | 防遮挡：把避让区来源写入运行时 shared。内核双管齐下 —— 轨道调度优先避开避让区，绘制期再对避让区做 evenodd 裁剪，人物矩形内不会出现任何弹幕像素（视觉上弹幕从人身后穿过）。默认静态安全区（顶/底条带），可选接 MediaPipe（消费方注入 provider）。发布包不捆绑 ML。 | `provider` = undefined<br/>`reservedBands` = { top: 0.18, bottom: 0.12 } | 0.1.0 | occlusion, track, strategy |
| [SensitiveFilterPlugin](./SensitiveFilterPlugin) | 敏感词过滤：命中词按 mode 打码或删除；打码条保留并标记 masked，避免弹幕流闪烁。 | `words` = []<br/>`mask` = "*"<br/>`mode` = "mask" | 0.1.0 | filter, safety, data |
| [SettingsPanelPlugin](./SettingsPanelPlugin) | 弹幕设置面板（UI 面）：不透明度/速度/轨道高度滑块，变更经 bus 广播 danmaku:settings，由消费方更新 props。 | `opacity` = 1<br/>`speed` = 1<br/>`trackHeight` = 28 | 0.1.0 | ui, settings, overlay |
| [SpeedControlPlugin](./SpeedControlPlugin) | 速度控制：飞行时长按 factor 缩放并夹在 [min,max]；未指定 duration 用 defaultDuration 作基准。 | `factor` = 1<br/>`minDuration` = 4<br/>`maxDuration` = 16<br/>`defaultDuration` = 8 | 0.1.0 | speed, duration, data |
| [StatsBarPlugin](./StatsBarPlugin) | 弹幕统计条（UI 面）：读取领域 data 展示弹幕总数/置顶数/各模式计数，纯展示不修改弹幕流。 | `showModes` = true | 0.1.0 | ui, stats, toolbar |
| [StylePresetPlugin](./StylePresetPlugin) | 统一样式预设：为未指定样式的弹幕补齐 fontFamily/fontWeight/fontSize 默认，整场风格统一。 | `fontFamily` = system-ui, sans-serif<br/>`fontWeight` = 400<br/>`fontSize` = 22 | 0.1.0 | style, preset, data |
| [TrackStrategyPlugin](./TrackStrategyPlugin) | 轨道分配策略：vipTop 把管理员/高等级滚动弹幕建议钉到顶部轨道；spread 让其余分散起始轨道。仅产出建议，是否采用由调度器裁决。 | `vipTop` = true<br/>`vipLevel` = 18<br/>`spread` = false | 0.1.0 | track, strategy, data |
| [UserMutePlugin](./UserMutePlugin) | 用户静音：users 中的用户弹幕被删除；allowAdmins 时管理员豁免，避免误伤房管。 | `users` = []<br/>`allowAdmins` = true | 0.1.0 | mute, user, data |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
