# 结构化简历 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AiPolish](./AiPolishPlugin) | AI 润色：调用可插拔服务润色摘要 / 工作描述 / 项目描述，可一键还原（不硬编码密钥）。 | `fields` = 三项全开<br/>`tone` = -<br/>`polish` = - | 0.1.0 | ai, transformData, renderToolbar |
| [AtsScore](./AtsScorePlugin) | ATS 兼容性评分：扫描常见雷区（缺姓名/联系方式/量化亮点/命中 JD 关键词等），输出 0-100 评分与改进建议。纯分析不改数据。 | `jobKeywords` = []<br/>`rules` = 内置 8 条 | 0.1.0 | ats, transformData, renderFooter, renderOverlay |
| [AttachmentPreview](./AttachmentPreviewPlugin) | 附件预览：列出附件卡片（PDF / 图片 / 链接），点击在灯箱中预览。 | `items` = [] | 0.1.0 | attachment, renderAttachments, renderOverlay, transformData |
| [ContactDesensitize](./ContactDesensitizePlugin) | 联系方式脱敏：对电话 / 邮箱 / 地址做可逆脱敏（138****1234），公开分享时保护隐私。 | `mode` = mask<br/>`fields` = 全部<br/>`masks` = - | 0.1.0 | privacy, transformData, renderToolbar |
| [DeliverTrack](./DeliverTrackPlugin) | 投递追踪：记录投递去向与状态（投递 / 面试 / offer / 拒绝），页脚汇总，浮层时间线。 | `initial` = []<br/>`onChange` = - | 0.1.0 | deliver, renderFooter, renderOverlay |
| [ExportPdf](./ExportPdfPlugin) | 导出 PDF：打印通道（配合 PrintOptimize）或 canvas 通道（html2canvas+jsPDF 拼页，按需加载）。 | `method` = print<br/>`fileName` = resume.pdf<br/>`onBeforeExport` = - | 0.1.0 | export, renderToolbar |
| [KeywordHighlight](./KeywordHighlightPlugin) | 关键词高亮：输入 JD 关键词，核心文本中命中词以 &lt;mark&gt; 高亮，辅助定制与 ATS 自检。纯 state 驱动，不抢槽。 | `keywords` = []<br/>`color` = var(--vr-accent) | 0.1.0 | highlight, state, renderToolbar |
| [MultiLang](./MultiLangPlugin) | 多语言：在预设语言间切换，整体翻译文本字段（缺失字段保留原文降级）。 | `locales` = -<br/>`default` = 首个语言<br/>`detect` = -<br/>`translations` = - | 0.1.0 | i18n, transformData, renderToolbar, onMount |
| [PrintOptimize](./PrintOptimizePlugin) | 打印优化：注入 @media print 样式，分页不断行、隐藏工具条与遮罩、按 A4 出页，与 ExportPdf 协同。 | `pageSize` = A4<br/>`margin` = 14mm<br/>`hideOnPrint` = 工具条等 | 0.1.0 | print, onMount |
| [PrivacyMask](./PrivacyMaskPlugin) | 隐私遮罩：一键进入隐私模式（整页毛玻璃或字段级隐藏），防截图/分享泄露。 | `mode` = blur<br/>`fields` = ["summary","contacts"] | 0.1.0 | privacy, renderOverlay, transformData, renderToolbar |
| [QrCode](./QrCodePlugin) | 二维码：把联系方式 / 链接编码为二维码，作角标常显或弹窗展示（qrcode 按需加载）。 | `content` = vCard(联系方式)<br/>`position` = corner<br/>`size` = 96 | 0.1.0 | qr, renderOverlay, onMount, renderToolbar |
| [SectionCollapse](./SectionCollapsePlugin) | 板块折叠：为每个板块头部加折叠开关，折叠态隐藏正文。纯 state 驱动（collapseMode/collapsed），不抢槽，可与 TimelineView 并存。 | `defaultOn` = false<br/>`defaultCollapsed` = [] | 0.1.0 | collapse, state, renderToolbar |
| [SectionReorder](./SectionReorderPlugin) | 板块重排：调整基本信息 / 工作 / 教育 / 技能等板块顺序，顺序经 ctx.state.sectionOrder 驱动核心渲染。 | `sections` = 全板块 | 0.1.0 | layout, renderToolbar, renderOverlay |
| [ShareLink](./ShareLinkPlugin) | 分享链接：生成可分享 URL（编码数据或指向宿主），弹窗复制；无宿主时提示数据安全。 | `baseUrl` = -<br/>`onBuildUrl` = - | 0.1.0 | share, renderToolbar, renderOverlay |
| [SignatureStamp](./SignatureStampPlugin) | 电子落款：文末加签名（姓名/图片）+ 签署日期；可选 CSS 圆形印章（renderOverlay 角标）。 | `name` = basics.name<br/>`image` = -<br/>`date` = 今天<br/>`stamp` = none<br/>`stampText` = 已确认 | 0.1.0 | signature, stamp, renderFooter, renderOverlay |
| [StatSummary](./StatSummaryPlugin) | 简历数据概览：在基本信息区追加工作段数 / 技能数 / 项目数 / 最高学历等统计徽章（装饰累积槽 renderBasics）。 | `items` = 四项全开 | 0.1.0 | stats, renderBasics |
| [TemplateSwitch](./TemplateSwitchPlugin) | 模板切换：在经典 / 现代 / 紧凑 / 学术等版式间切换，经 CSS 变量驱动整体观感。 | `templates` = 4 套内置<br/>`defaultId` = classic | 0.1.0 | layout, template, renderToolbar, onMount |
| [ThemeCustomize](./ThemeCustomizePlugin) | 主题配色定制：预设强调色 + 自定义取色器，经 CSS 变量注入容器。 | `presets` = 4 套内置<br/>`default` = blue | 0.1.0 | theme, renderToolbar, onMount |
| [TimelineView](./TimelineViewPlugin) | 时间轴可视化：把工作 / 教育经历从列表切换为竖向时间轴（圆点 + 连线 + 日期）。 | `sections` = 两者<br/>`mode` = list | 0.1.0 | view, renderWork, renderEducation, renderToolbar |
| [Versioning](./VersioningPlugin) | 版本管理：快照数据 / 模板 / 语言 / 隐私态，保存命名版本，可恢复 / 删除，持久化 localStorage。 | `storage` = local<br/>`maxVersions` = 20 | 0.1.0 | version, renderToolbar, renderFooter, renderOverlay |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
