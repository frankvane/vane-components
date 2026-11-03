# 结构化简历 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AiPolish](#aipolish) | AI 润色：调用可插拔服务润色摘要 / 工作描述 / 项目描述，可一键还原（不硬编码密钥）。 | `fields` = 三项全开<br/>`tone` = -<br/>`polish` = - | 0.1.0 | ai, transformData, renderToolbar |
| [AtsScore](#atsscore) | ATS 兼容性评分：扫描常见雷区（缺姓名/联系方式/量化亮点/命中 JD 关键词等），输出 0-100 评分与改进建议。纯分析不改数据。 | `jobKeywords` = []<br/>`rules` = 内置 8 条 | 0.1.0 | ats, transformData, renderFooter, renderOverlay |
| [AttachmentPreview](#attachmentpreview) | 附件预览：列出附件卡片（PDF / 图片 / 链接），点击在灯箱中预览。 | `items` = [] | 0.1.0 | attachment, renderAttachments, renderOverlay, transformData |
| [ContactDesensitize](#contactdesensitize) | 联系方式脱敏：对电话 / 邮箱 / 地址做可逆脱敏（138****1234），公开分享时保护隐私。 | `mode` = mask<br/>`fields` = 全部<br/>`masks` = - | 0.1.0 | privacy, transformData, renderToolbar |
| [DeliverTrack](#delivertrack) | 投递追踪：记录投递去向与状态（投递 / 面试 / offer / 拒绝），页脚汇总，浮层时间线。 | `initial` = []<br/>`onChange` = - | 0.1.0 | deliver, renderFooter, renderOverlay |
| [ExportPdf](#exportpdf) | 导出 PDF：打印通道（配合 PrintOptimize）或 canvas 通道（html2canvas+jsPDF 拼页，按需加载）。 | `method` = print<br/>`fileName` = resume.pdf<br/>`onBeforeExport` = - | 0.1.0 | export, renderToolbar |
| [KeywordHighlight](#keywordhighlight) | 关键词高亮：输入 JD 关键词，核心文本中命中词以 &lt;mark&gt; 高亮，辅助定制与 ATS 自检。纯 state 驱动，不抢槽。 | `keywords` = []<br/>`color` = var(--vr-accent) | 0.1.0 | highlight, state, renderToolbar |
| [MultiLang](#multilang) | 多语言：在预设语言间切换，整体翻译文本字段（缺失字段保留原文降级）。 | `locales` = -<br/>`default` = 首个语言<br/>`detect` = -<br/>`translations` = - | 0.1.0 | i18n, transformData, renderToolbar, onMount |
| [PrintOptimize](#printoptimize) | 打印优化：注入 @media print 样式，分页不断行、隐藏工具条与遮罩、按 A4 出页，与 ExportPdf 协同。 | `pageSize` = A4<br/>`margin` = 14mm<br/>`hideOnPrint` = 工具条等 | 0.1.0 | print, onMount |
| [PrivacyMask](#privacymask) | 隐私模式：整页毛玻璃视觉遮挡 + 配置字段的数据级隐藏（默认 summary/contacts）。毛玻璃不防复制，敏感信息请确保位于隐藏字段或已脱敏。 | `mode` = blur<br/>`fields` = ["summary","contacts"] | 0.1.0 | privacy, renderOverlay, transformData, renderToolbar |
| [QrCode](#qrcode) | 二维码：把联系方式 / 链接编码为二维码，作角标常显或弹窗展示（qrcode 按需加载）。 | `content` = vCard(联系方式)<br/>`position` = corner<br/>`size` = 96 | 0.1.0 | qr, renderOverlay, onMount, renderToolbar |
| [SectionCollapse](#sectioncollapse) | 板块折叠：为每个板块头部加折叠开关，折叠态隐藏正文。纯 state 驱动（collapseMode/collapsed），不抢槽，可与 TimelineView 并存。 | `defaultOn` = false<br/>`defaultCollapsed` = [] | 0.1.0 | collapse, state, renderToolbar |
| [SectionReorder](#sectionreorder) | 板块重排：调整基本信息 / 工作 / 教育 / 技能等板块顺序，顺序经 ctx.state.sectionOrder 驱动核心渲染。 | `sections` = 全板块 | 0.1.0 | layout, renderToolbar, renderOverlay |
| [ShareLink](#sharelink) | 分享链接：默认只生成宿主地址，不把简历数据内联进 URL；需要携带数据时由 onBuildUrl 生成脱敏短链。弹窗复制并反馈结果。 | `baseUrl` = -<br/>`onBuildUrl` = - | 0.1.0 | share, renderToolbar, renderOverlay |
| [SignatureStamp](#signaturestamp) | 电子落款：文末加签名（姓名/图片）+ 签署日期；可选 CSS 圆形印章（renderOverlay 角标）。 | `name` = basics.name<br/>`image` = -<br/>`date` = 今天<br/>`stamp` = none<br/>`stampText` = 已确认 | 0.1.0 | signature, stamp, renderFooter, renderOverlay |
| [StatSummary](#statsummary) | 简历数据概览：在基本信息区追加工作段数 / 技能数 / 项目数 / 最高学历等统计徽章（装饰累积槽 renderBasics）。 | `items` = 四项全开 | 0.1.0 | stats, renderBasics |
| [TemplateSwitch](#templateswitch) | 模板切换：在经典 / 现代 / 紧凑 / 学术等版式间切换，经 CSS 变量驱动整体观感。 | `templates` = 4 套内置<br/>`defaultId` = classic | 0.1.0 | layout, template, renderToolbar, onMount |
| [ThemeCustomize](#themecustomize) | 主题配色定制：预设强调色 + 自定义取色器，经 CSS 变量注入容器。 | `presets` = 4 套内置<br/>`default` = blue | 0.1.0 | theme, renderToolbar, onMount |
| [TimelineView](#timelineview) | 时间轴可视化：把工作 / 教育经历从列表切换为竖向时间轴（圆点 + 连线 + 日期）。 | `sections` = 两者<br/>`mode` = list | 0.1.0 | view, renderWork, renderEducation, renderToolbar |
| [Versioning](#versioning) | 版本管理：快照数据 / 模板 / 语言 / 隐私态，保存命名版本，可恢复 / 删除；localStorage 持久化（数据留在本地，请自行按用户隔离 storageKey）。 | `storage` = local<br/>`storageKey` = "vane-resume-versions"<br/>`maxVersions` = 20<br/>`onStorageError` = -<br/>`onRestore` = - | 0.1.0 | version, renderToolbar, renderFooter, renderOverlay |

## 插件能力明细

### AiPolish

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fields` | `("summary"\|"work"\|"projects")[]` | `三项全开` | 润色字段 |
| `tone` | `string` | `-` | 语气偏好，透传给 polish |
| `polish` | `(text, field) => Promise<string>` | `-` | 可插拔润色服务（必填，否则按钮禁用） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `transformData` | 渲染前，对简历数据链式改写 | 模板 / 语言切换、字段脱敏、结构调整 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AtsScore

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `jobKeywords` | `string[]` | `[]` | JD 关键词，命中加分 |
| `rules` | `AtsRule[]` | `内置 8 条` | 可扩展评分规则 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对简历数据链式改写 | 模板 / 语言切换、字段脱敏、结构调整 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderFooter` | 每次渲染，页脚槽位 | 版权、更新时间、导出提示 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AttachmentPreview

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `AttachmentItem[]` | `[]` | 预置附件（合并进 data.attachments） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对简历数据链式改写 | 模板 / 语言切换、字段脱敏、结构调整 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderAttachments` | 每次渲染，附件区槽位 | 作品集、证书、项目链接等附件列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ContactDesensitize

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mode` | `"mask"\|"hide"\|"show"` | `mask` | 脱敏 / 隐藏 / 明文 |
| `fields` | `ContactType[]` | `全部` | 需脱敏的联系方式类型 |
| `masks` | `Partial<Record<type,(v)=>string>>` | `-` | 按类型自定义脱敏器 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `transformData` | 渲染前，对简历数据链式改写 | 模板 / 语言切换、字段脱敏、结构调整 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DeliverTrack

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `initial` | `Delivery[]` | `[]` | 初始投递记录 |
| `onChange` | `(list) => void` | `-` | 列表变化回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderFooter` | 每次渲染，页脚槽位 | 版权、更新时间、导出提示 |
| `resume:deliver:add` | 外部通过 bus.emit 投递一条新数据时（本插件订阅） | 接收外部投递的简历数据并并入当前列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ExportPdf

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `method` | `"print"\|"canvas"` | `print` | 导出通道 |
| `fileName` | `string` | `resume.pdf` | canvas 模式文件名 |
| `onBeforeExport` | `() => void` | `-` | 导出前回调（如先收起隐私遮罩） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |
| `resume:export` | 点击导出并选定方式后 | 广播 { method }，由外部执行打印 / 下载 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### KeywordHighlight

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `keywords` | `string[] \| ()=>string[]` | `[]` | 初始高亮关键词 |
| `color` | `string` | `var(--vr-accent)` | 高亮标记 / 芯片描边色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MultiLang

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `locales` | `{code,label}[]` | `-` | 语言列表 |
| `default` | `string` | `首个语言` | 默认语言 code |
| `detect` | `() => string` | `-` | 可选的运行时语言探测 |
| `translations` | `Record<locale, Partial<ResumeData>>` | `-` | 各语言翻译（顶层字段整体覆盖） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `transformData` | 渲染前，对简历数据链式改写 | 模板 / 语言切换、字段脱敏、结构调整 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |
| `resume:lang-change` | 切换简历语言时 | 广播语言 code，触发数据与文案切换 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PrintOptimize

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pageSize` | `"A4"\|"A3"\|"letter"` | `A4` | 纸张尺寸 |
| `margin` | `string` | `14mm` | 页边距 |
| `hideOnPrint` | `string[]` | `工具条等` | 打印时隐藏的选择器 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `resume:export` | 点击导出并选定方式后 | 广播 { method }，由外部执行打印 / 下载 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PrivacyMask

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mode` | `"blur" \| "hide"` | `blur` | 毛玻璃视觉遮罩 / 仅字段级隐藏（两者都做数据级隐藏） |
| `fields` | `string[]` | `["summary","contacts"]` | 隐私模式下隐藏的字段 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `transformData` | 渲染前，对简历数据链式改写 | 模板 / 语言切换、字段脱敏、结构调整 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### QrCode

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | `string \| () => string` | `vCard(联系方式)` | 二维码内容 |
| `position` | `"corner"\|"avatar"\|"modal"` | `corner` | 常显角标 / 弹窗 |
| `size` | `number` | `96` | 像素尺寸 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SectionCollapse

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `defaultOn` | `boolean` | `false` | 初始是否开启折叠模式 |
| `defaultCollapsed` | `SectionKey[]` | `[]` | 初始折叠的板块 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SectionReorder

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `sections` | `SectionKey[]` | `全板块` | 可重排的板块集合 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ShareLink

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `-` | 宿主基础地址（不含简历数据） |
| `onBuildUrl` | `(data) => string \| Promise<string>` | `-` | 注入宿主链接构建（推荐，可在此生成脱敏短链） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SignatureStamp

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | `basics.name` | 签名姓名 |
| `image` | `string` | `-` | 手写签名图片 URL |
| `date` | `()=>string` | `今天` | 签署日期 |
| `stamp` | `'none'\|'seal'` | `none` | 是否绘制印章 |
| `stampText` | `string` | `已确认` | 印章文字 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderFooter` | 每次渲染，页脚槽位 | 版权、更新时间、导出提示 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StatSummary

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `StatKey[]` | `四项全开` | 展示指标：expYears | skillCount | projectCount | eduLevel |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderBasics` | 每次渲染，基本信息区槽位 | 姓名、职位、联系方式等抬头信息 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### TemplateSwitch

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `templates` | `TemplateDef[]` | `4 套内置` | 模板定义（id / label / vars 为 CSS 变量覆盖） |
| `defaultId` | `string` | `classic` | 默认模板 id |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |
| `resume:template-change` | 切换模板时 | 广播模板 id，触发版式重排 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ThemeCustomize

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `presets` | `ThemePreset[]` | `4 套内置` | 主题预设（id / label / vars） |
| `default` | `string` | `blue` | 默认主题 id |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### TimelineView

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `sections` | `("work"\|"education")[]` | `两者` | 启用时间轴的板块 |
| `mode` | `"list"\|"timeline"` | `list` | 初始视图 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |
| `renderWork` | 每次渲染，工作经历区槽位 | 公司、职位、时间段的排版与补充字段 |
| `renderEducation` | 每次渲染，教育经历区槽位 | 学校、专业、时间段的排版与补充字段 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### Versioning

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `"local"\|"memory"` | `local` | 持久化方式；memory 仅当前页面有效 |
| `storageKey` | `string` | `vane-resume-versions` | 存储键，多实例 / 多用户请分别指定 |
| `maxVersions` | `number` | `20` | 最大保留版本数 |
| `onStorageError` | `(error) => void` | `-` | 写入 / 读取失败回调 |
| `onRestore` | `(version) => void` | `-` | 恢复回调，宿主可回写受控数据 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 简历组件挂载完成 | 初始化副作用（读取本地版本、恢复状态） |
| `renderOverlay` | 每次渲染，绝对定位覆盖在主内容之上 | 渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局 |
| `renderFooter` | 每次渲染，页脚槽位 | 版权、更新时间、导出提示 |
| `renderToolbar` | 每次渲染，工具栏槽位 | 模板切换、导出、语言、版本等全局操作 |
| `resume:data-replace` | 恢复某个版本时 | 广播被恢复的数据，整体替换当前简历 |
| `resume:version:delete` | 删除版本时 | 广播版本 id |
| `resume:version:save` | 保存版本快照时 | 广播快照对象，供持久化到外部存储 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
