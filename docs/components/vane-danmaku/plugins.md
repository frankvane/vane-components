# 弹幕 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AtMentionPlugin](#atmentionplugin) | @提及高亮：识别 @用户名 写入 renderHint.rich 带色分段，与 KeywordHighlight 共用分段机制。 | `color` = "#4ea1ff"<br/>`pattern` = @[\w\u4e00-\u9fa5]+ | 0.1.0 | mention, highlight, data |
| [AuditLogPlugin](#auditlogplugin) | 弹幕审计：不增删弹幕，对每条触发 onLog 回调（审核/风控/落库），可选经 bus 广播 danmaku:audit。 | `onLog` = undefined<br/>`emit` = false | 0.1.0 | audit, log, data |
| [CmdParsePlugin](#cmdparseplugin) | 互动指令：/clear、#lottery 等弹幕在 transformData 阶段被识别、从渲染流移除，并经 bus 事件触发业务动作。 | `prefixes` = ["/", "#"]<br/>`commands` = { clear, lottery } | 0.1.0 | command, interaction, data |
| [ColorPolicyPlugin](#colorpolicyplugin) | 角色配色策略：未显式指定 color 时按角色着色——管理员红、高等级金，普通保持白。放在流水线靠后避免覆盖业务配色。 | `adminColor` = "#ff4d4f"<br/>`vipColor` = "#ffd54a"<br/>`vipLevel` = 18 | 0.1.0 | color, policy, data |
| [CommandInputPlugin](#commandinputplugin) | 弹幕/指令输入框（UI 面）：提交经 bus 广播 danmaku:send {text}，由消费方追加弹幕或交给 CmdParse 解析指令。 | `placeholder` = 发条弹幕 / 指令（/clear） | 0.1.0 | ui, input, command |
| [DedupPlugin](#dedupplugin) | 弹幕去重：同一用户+相同文案在 window 秒内重复出现只保留首条，缓解刷屏。 | `window` = 5 | 0.1.0 | dedup, cleanup, data |
| [EmojiRenderPlugin](#emojirenderplugin) | 表情短码转义：把 :shortcode:（如 :rocket:）替换为 unicode 表情，内核按普通文字绘制。 | `map` = {...内置常用表} | 0.1.0 | emoji, text, data |
| [FanBadgePlugin](#fanbadgeplugin) | 粉丝牌：按 userId 富化 meta.fanBadge，canvas 内核据此绘制牌底块 + 白字。插件只写数据，绝不直绘。 | `badges` = {}<br/>`defaultColor` = "#ff7a29" | 0.1.0 | badge, enrich, data |
| [FilterTogglePlugin](#filtertoggleplugin) | 过滤开关条（UI 面）：一排过滤项 chip，点击经 bus 广播 danmaku:filter {key,enabled}，由消费方重建对应数据面插件。 | `defaults` = 全部开启 | 0.1.0 | ui, filter, toolbar |
| [GiftComboPlugin](#giftcomboplugin) | 礼物连击聚合：同用户相同「基础词 xN」紧邻出现合并为一条并累加连击数，内核末尾绘制 xN 角标。 | `pattern` = ^(.*?)\s*x(\d+)$ | 0.1.0 | gift, combo, data |
| [KeywordBlockPlugin](#keywordblockplugin) | 关键词硬屏蔽：命中词直接从弹幕流删除（区别于 SensitiveFilter 打码保留），用于违禁/竞品词。 | `words` = []<br/>`mode` = "contains" | 0.1.0 | block, filter, data |
| [KeywordHighlightPlugin](#keywordhighlightplugin) | 关键词高亮：命中词写入 renderHint.rich 带色分段，内核按段着色，其余保持原色。 | `keywords` = []<br/>`color` = "#ff7a29" | 0.1.0 | highlight, keyword, data |
| [LangFilterPlugin](#langfilterplugin) | 语种过滤：弹幕须至少命中 allow 中一种字符体系才保留；blockUnknown 时纯符号刷屏直接丢弃。 | `allow` = ["cjk","latin"]<br/>`blockUnknown` = true | 0.1.0 | lang, filter, data |
| [PinnedTopPlugin](#pinnedtopplugin) | 高赞置顶：高等级弹幕标记 pinned + ring，内核钉在顶部带、居中停留并加高赞环高亮，不随风滚动。 | `minLevel` = 18 | 0.1.0 | pin, highlight, data |
| [RateLimitPlugin](#ratelimitplugin) | 单用户限流：window 秒内超过 max 条的同用户弹幕被丢弃，防刷屏压垮轨道。 | `max` = 3<br/>`window` = 10 | 0.1.0 | ratelimit, flood, data |
| [SafeZonePlugin](#safezoneplugin) | 防遮挡：把避让区来源写入运行时 shared。内核双管齐下 —— 轨道调度优先避开避让区，绘制期再对避让区做 evenodd 裁剪，人物矩形内不会出现任何弹幕像素（视觉上弹幕从人身后穿过）。默认静态安全区（顶/底条带），可选接 MediaPipe（消费方注入 provider）。发布包不捆绑 ML。 | `provider` = undefined<br/>`reservedBands` = { top: 0.18, bottom: 0.12 } | 0.1.0 | occlusion, track, strategy |
| [SensitiveFilterPlugin](#sensitivefilterplugin) | 敏感词过滤：命中词按 mode 打码或删除；打码条保留并标记 masked，避免弹幕流闪烁。 | `words` = []<br/>`mask` = "*"<br/>`mode` = "mask" | 0.1.0 | filter, safety, data |
| [SettingsPanelPlugin](#settingspanelplugin) | 弹幕设置面板（UI 面）：不透明度/速度/轨道高度滑块，变更经 bus 广播 danmaku:settings，由消费方更新 props。 | `opacity` = 1<br/>`speed` = 1<br/>`trackHeight` = 28 | 0.1.0 | ui, settings, overlay |
| [SpeedControlPlugin](#speedcontrolplugin) | 速度控制：飞行时长按 factor 缩放并夹在 [min,max]；未指定 duration 用 defaultDuration 作基准。 | `factor` = 1<br/>`minDuration` = 4<br/>`maxDuration` = 16<br/>`defaultDuration` = 8 | 0.1.0 | speed, duration, data |
| [StatsBarPlugin](#statsbarplugin) | 弹幕统计条（UI 面）：读取领域 data 展示弹幕总数/置顶数/各模式计数，纯展示不修改弹幕流。 | `showModes` = true | 0.1.0 | ui, stats, toolbar |
| [StylePresetPlugin](#stylepresetplugin) | 统一样式预设：为未指定样式的弹幕补齐 fontFamily/fontWeight/fontSize 默认，整场风格统一。 | `fontFamily` = system-ui, sans-serif<br/>`fontWeight` = 400<br/>`fontSize` = 22 | 0.1.0 | style, preset, data |
| [TrackStrategyPlugin](#trackstrategyplugin) | 轨道分配策略：vipTop 把管理员/高等级滚动弹幕建议钉到顶部轨道；spread 让其余分散起始轨道。仅产出建议，是否采用由调度器裁决。 | `vipTop` = true<br/>`vipLevel` = 18<br/>`spread` = false | 0.1.0 | track, strategy, data |
| [UserMutePlugin](#usermuteplugin) | 用户静音：users 中的用户弹幕被删除；allowAdmins 时管理员豁免，避免误伤房管。 | `users` = []<br/>`allowAdmins` = true | 0.1.0 | mute, user, data |

## 插件能力明细

### AtMentionPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | `#4ea1ff` | @提及着色 |
| `pattern` | `string` | `@[\w\u4e00-\u9fa5]+` | 自定义提及正则 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AuditLogPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `onLog` | `(item, context) => void` | `undefined` | 每条弹幕的审计回调 |
| `emit` | `boolean` | `false` | 是否经 bus 广播 danmaku:audit |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |
| `danmaku:audit` | 每条弹幕进入审核队列时 | 携带 { item } 供外部审核系统接管 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CmdParsePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `prefixes` | `string[]` | `["/", "#"]` | 指令前缀 |
| `commands` | `Record<string, string>` | `{ clear, lottery }` | 指令名 -&gt; bus 事件 type |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |
| `danmaku:command` | 命中指令语法（如 /clear）时 | 广播 { type, payload, item } 给业务层执行动作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ColorPolicyPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `adminColor` | `string` | `#ff4d4f` | 管理员弹幕色 |
| `vipColor` | `string` | `#ffd54a` | 高等级弹幕色 |
| `vipLevel` | `number` | `18` | 触发 vip 着色的等级阈值 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CommandInputPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `placeholder` | `string` | `发条弹幕 / 指令（/clear）` | 输入框占位符 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，播放器底部槽位 | 弹幕输入框、发送按钮、快捷指令入口 |
| `danmaku:send` | 输入框提交发送时 | 广播待发送文本 { text }，由外部决定是否入列 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DedupPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `window` | `number` | `5` | 去重时间窗（秒） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### EmojiRenderPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `map` | `Record<string,string>` | `{...内置常用表}` | 短码-&gt;表情映射，可覆盖/扩充内置表 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FanBadgePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `badges` | `Record<string, FanBadge>` | `{}` | userId -&gt; 粉丝牌（name/level/color） |
| `defaultColor` | `string` | `#ff7a29` | lookup 未提供 color 时的缺省牌底色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FilterTogglePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `defaults` | `string[]` | `全部开启` | 默认开启的过滤项 key |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，播放器顶部槽位 | 弹幕开关、密度设置、工具栏 |
| `danmaku:filter` | 过滤开关切换时 | 广播 { key, enabled }，同步过滤策略 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### GiftComboPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pattern` | `string` | `^(.*?)\s*x(\d+)$` | 连击识别正则（需捕获 基础词 与 次数） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### KeywordBlockPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `words` | `string[]` | `[]` | 硬屏蔽词 |
| `mode` | `"contains"\|"equals"` | `contains` | contains=包含即删；equals=整句相等才删 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### KeywordHighlightPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `keywords` | `string[]` | `[]` | 要高亮的词 |
| `color` | `string` | `#ff7a29` | 高亮色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LangFilterPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `allow` | `("cjk"\|"latin"\|"symbol")[]` | `["cjk","latin"]` | 允许的字符体系 |
| `blockUnknown` | `boolean` | `true` | 无命中体系（纯符号）直接丢弃 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PinnedTopPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `minLevel` | `number` | `18` | 高赞阈值：meta.level &gt;= 该值即置顶 + 高赞环 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RateLimitPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `max` | `number` | `3` | 窗口内单用户最多保留条数 |
| `window` | `number` | `10` | 统计窗口（秒） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SafeZonePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `provider` | `() => Rect[]` | `undefined` | 消费方注入的实时避让区（如 MediaPipe Selfie Seg 掩膜→矩形 / Pose 点→凸包） |
| `reservedBands` | `{ top?, bottom? }` | `{ top: 0.18, bottom: 0.12 }` | 静态安全区比例，中间留空防遮挡 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SensitiveFilterPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `words` | `string[]` | `[]` | 敏感词列表（子串匹配） |
| `mask` | `string` | `*` | 打码字符 |
| `mode` | `"mask"\|"hide"` | `mask` | mask=打码保留整条；hide=直接删除整条 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SettingsPanelPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `opacity` | `number` | `1` | 初始不透明度 |
| `speed` | `number` | `1` | 初始速度系数 |
| `trackHeight` | `number` | `28` | 初始轨道高度（px） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在播放器画面之上 | 渲染在飞弹幕、特效层、命中区域 |
| `danmaku:settings` | 设置面板任一配置变更时 | 广播完整配置快照，供持久化 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SpeedControlPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `factor` | `number` | `1` | 飞行时长系数（&gt;1 更慢） |
| `minDuration` | `number` | `4` | 时长下限（秒） |
| `maxDuration` | `number` | `16` | 时长上限（秒） |
| `defaultDuration` | `number` | `8` | 缺省飞行时长（秒） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StatsBarPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showModes` | `boolean` | `true` | 是否显示各模式计数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，播放器顶部槽位 | 弹幕开关、密度设置、工具栏 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StylePresetPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fontFamily` | `string` | `system-ui, sans-serif` | 字体族 |
| `fontWeight` | `number` | `400` | 字重 |
| `fontSize` | `number` | `22` | 基础字号（仅当单条未指定时生效） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### TrackStrategyPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `vipTop` | `boolean` | `true` | 管理员/高等级钉顶部轨道 |
| `vipLevel` | `number` | `18` | 触发 vipTop 的等级阈值 |
| `spread` | `boolean` | `false` | 其余滚动弹幕分散起始轨道 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### UserMutePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `users` | `string[]` | `[]` | 被静音的用户 id |
| `allowAdmins` | `boolean` | `true` | 管理员豁免静音 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对弹幕列表链式改写 | 过滤、去重、着色、限流；下游看到的是改写后的待渲染列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
