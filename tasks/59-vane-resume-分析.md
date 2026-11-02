# vane-resume 分析（Phase 1.1）

> 结构化简历系统。核心只做「分段式文档布局 + 生命周期转发」，全部可变能力交给插件。
> 本文件拍板：数据模型、核心布局、槽位模型、20 个插件的设计与实现逻辑、依赖与体积预算。
> 配套实施清单见 `tasks/60-vane-resume-实施清单.md`。

---

## 1. 系统总览

- **包名**：`vane-resume`（匹配 `^vane-[a-z0-9]+(-[a-z0-9]+)*$`）
- **UMD**：`VaneResume`；**CSS 变量前缀**：`--vane-resume-`
- **核心组件**：`ResumeCore`（`src/components/ResumePlugin/ResumeCore.tsx`）
- **插件目录**：`src/custom-plugins/<Name>Plugin/`（`create.tsx` + `doc.json` + `index.ts`，命名匹配 `^[A-Z][A-Za-z0-9]*Plugin$`）
- **依赖派系**：`vane-plugin-core` 走 **peer 外部化**（`peerDependencies: workspace:*`）；`react`/`react-dom` 仅 peer。运行时第三方库（如 `qrcode`、`jspdf`+`html2canvas`）放 `dependencies` 并 **dynamic import** 进独立 chunk，守住体积门。
- **入口划分**：根 `src/index.ts` 只聚合 `ResumeCore` + `withResumePlugins` + 契约类型；插件走 `./custom-plugins/<Name>` 子路径（ADR-6/14，根入口不桶导出插件）。

---

## 2. 数据模型（结构化 ResumeData）

核心消费一份结构化数据，所有插件围绕它做增删改与可视化。

```ts
interface ResumeData {
  basics: {
    name: string;
    title: string;            // 求职意向 / 头衔
    avatar?: string;          // 图片 URL
    summary?: string;
    location?: string;
    birthDate?: string;
    contacts: ContactItem[];  // 受 ContactDesensitize / PrivacyMask 改写
  };
  work: WorkItem[];           // 工作经历（受 TimelineView 可视化）
  education: EduItem[];       // 教育背景
  skills: SkillGroup[];       // 技能（分组）
  projects?: ProjectItem[];
  awards?: AwardItem[];
  languages?: LangItem[];
  certificates?: CertItem[];
  attachments?: AttachmentItem[];  // 受 AttachmentPreview 渲染
}
interface ContactItem { type: "phone" | "email" | "address" | "social"; label: string; value: string; }
interface WorkItem { company: string; role: string; start: string; end: string; highlights: string[]; }
interface EduItem { school: string; degree: string; major?: string; start: string; end: string; }
interface SkillGroup { category: string; items: string[]; }
interface ProjectItem { name: string; role?: string; start?: string; end?: string; desc: string; links?: string[]; }
interface AttachmentItem { name: string; kind: "pdf" | "image" | "link"; url: string; size?: number; }
```

---

## 3. 核心布局与槽位模型（关键决策）

`ResumeCore` 渲染一个 A4 比例的分段式文档容器，按 `ctx.state.sectionOrder` 顺序输出板块，每个板块头部由核心统一绘制（天然支持 **SectionCollapse** 折叠与 **SectionReorder** 拖拽）。板块内容包括一段「核心默认渲染」+ 领域槽返回值。

### 3.1 两类槽（本包扩展点，区别于 vane-profile）

| 类别 | 行为 | 消费方式 | 用途插件 |
|---|---|---|---|
| **装饰累积槽**（数组） | 多插件返回值顺次拼接 | `renderResumeSlot` 收集全部非 null | toolbar / footer / overlay / attachments |
| **内容覆盖槽**（单值） | 最高 priority 插件返回值优先；无插件则返回核心默认渲染 | `renderResumeSlot` 取首个非 null，否则核心默认 | work / education / skills / projects / basics |

> 决策依据：TimelineView 需要**替换** work/education 的默认列表为时间轴；而 toolbar/footer/overlay 是多插件共存（模板切换按钮 + 导出按钮 + 分享按钮并排）。故分两类，避免「插件相互覆盖导致重影」（ADR 铁律：领域 HOC 不重复 compose 同名槽）。

### 3.2 槽位清单

- 内核 3 槽：`renderHeader`（→ 映射为 resume toolbar）、`renderFooter`、`renderOverlay`
- 领域槽（装饰累积）：`renderToolbar`、`renderAttachments`、`renderFooter`
- 领域槽（内容覆盖，带核心默认实现）：`renderBasics`、`renderWork`、`renderEducation`、`renderSkills`、`renderProjects`、`renderExtra`（awards/langs/certs 合集）

### 3.3 transformData 链顺序（priority 降序执行）

核心按 `transformData` 钩子 priority **从高到低** 串成管道；顺序即语义：

| 顺序 | 插件 | priority | 作用 |
|---|---|---|---|
| 1 | MultiLang | 52 | 先产出目标语言数据 |
| 2 | AiPolish | 50 | 润色（已本地化后的）文本 |
| 3 | ContactDesensitize | 48 | 脱敏联系方式（放最后，避免脱敏文本被再次处理） |
| 4 | PrivacyMask(hide 模式) | 46 | 字段级隐藏 |
| 5 | AtsScore(分析) | 44 | 仅写 `ctx.shared["ats:report"]`，不改数据 |

`transformProps` 链（主题 / 打印 / 重排 / 折叠）顺序：ThemeCustomize 20 → PrintOptimize 22 → SectionReorder 24 → SectionCollapse 26。

### 3.4 状态 / 共享约定

- `ctx.state`：UI 态（template、lang、privacyOn、theme、collapseMode、collapsed、sectionOrder、highlightKeywords、deliveries、versions、previewItem、atsScore…）
- `ctx.shared`：非渲染态（AiPolish 原稿快照、ATS 报告、版本快照 Map）
- 事件总线：`resume:template-change` / `resume:lang-change` / `resume:export` / `resume:data-replace` / `resume:deliver:add` / `resume:version:save|restore|delete` / `resume:qr:show`
- 改闭包态后必须 `ctx.forceUpdate()`；几何/显示类只经 state 驱动，不写本地副本。

---

## 4. 插件清单总表（20 个）

| # | 插件 | kebab(name) | 目录 | 主槽 | priority 区间 | 依赖 |
|---|---|---|---|---|---|---|
| 1 | TemplateSwitch | template-switch | TemplateSwitchPlugin | renderToolbar + transformProps | 12 | — |
| 2 | PrivacyMask | privacy-mask | PrivacyMaskPlugin | renderOverlay + transformData | 42 / 46 | — |
| 3 | AiPolish | ai-polish | AiPolishPlugin | renderToolbar + transformData | 16 / 50 | — |
| 4 | ExportPdf | export-pdf | ExportPdfPlugin | renderToolbar | 16 | PrintOptimize |
| 5 | MultiLang | multi-lang | MultiLangPlugin | renderToolbar + transformData | 14 / 52 | — |
| 6 | Versioning | versioning | VersioningPlugin | renderFooter + renderOverlay | 38 | — |
| 7 | DeliverTrack | deliver-track | DeliverTrackPlugin | renderFooter + renderOverlay | 36 | — |
| 8 | AttachmentPreview | attachment-preview | AttachmentPreviewPlugin | renderAttachments + renderOverlay | 30 / 44 | — |
| 9 | ContactDesensitize | contact-desensitize | ContactDesensitizePlugin | transformData | 48 | PrivacyMask(可选) |
| 10 | PrintOptimize | print-optimize | PrintOptimizePlugin | transformProps + onMount | 22 | ExportPdf |
| 11 | SectionReorder | section-reorder | SectionReorderPlugin | transformProps + renderOverlay | 24 | — |
| 12 | ThemeCustomize | theme-customize | ThemeCustomizePlugin | renderToolbar + transformProps | 18 / 20 | TemplateSwitch |
| 13 | ShareLink | share-link | ShareLinkPlugin | renderToolbar + renderOverlay | 18 | QrCode(可选) |
| 14 | QrCode | qr-code | QrCodePlugin | renderOverlay | 46 | — |
| 15 | TimelineView | timeline-view | TimelineViewPlugin | renderWork/renderEducation(覆盖) | 22 | — |
| 16 | KeywordHighlight | keyword-highlight | KeywordHighlightPlugin | state(高亮) | — | — |
| 17 | AtsScore | ats-score | AtsScorePlugin | renderFooter + renderOverlay + transformData | 38 / 44 | — |
| 18 | StatSummary | stat-summary | StatSummaryPlugin | renderBasics | 32 | — |
| 19 | SectionCollapse | section-collapse | SectionCollapsePlugin | transformProps + state | 26 | — |
| 20 | SignatureStamp | signature-stamp | SignatureStampPlugin | renderFooter + renderOverlay | 34 | — |

> priority 撞车规避：toolbar 10–19 / 内容覆盖 20–29 / basics·footer 30–39 / overlay 40–49 / transformData 44–52 / transformProps 20–26。

---

## 5. 各插件核心功能设计与实现逻辑

### 1. TemplateSwitch（模板切换）
- **核心功能**：在「经典 / 现代 / 紧凑 / 学术」等多套版式间切换，改变密度、配色、字体与板块间距。
- **实现逻辑**：
  - `config`: `{ templates: {id,label,cssClass}[]; defaultId?: string }`。
  - `onMount`：读 `props.defaultTemplate ?? config.defaultId`，`ctx.setState({ template: id })`。
  - `renderToolbar`：渲染分段控件；`onChange` → `ctx.setState({template})` + `ctx.bus.emit("resume:template-change", id)` + `ctx.forceUpdate()`。
  - `transformProps`：向容器注入 `data-template={id}` 与 `vc-tpl-<id>` class，CSS 据此切换版式。
  - 版式差异由 `src/styles/templates.css` 提供，不内置新 React 子树。

### 2. PrivacyMask（隐私遮罩）
- **核心功能**：一键把整份简历进入「隐私模式」——全局毛玻璃遮罩（防截图泄露）或字段级隐藏。
- **实现逻辑**：
  - `config`: `{ mode: "blur" | "hide"; fields?: string[] }`。
  - `state.privacyOn` 默认 false；`renderToolbar` 提供开关。
  - `mode:"blur"` → `renderOverlay` 返回全屏 `backdrop-filter:blur` 层 + 「隐私模式·内容已隐藏」角标（覆盖层不拦截工具条点击）。
  - `mode:"hide"` → `transformData`（priority 46）把 `fields` 对应字段置为空/占位。
  - 开关变化经 `ctx.forceUpdate()` 重渲。

### 3. AiPolish（AI 润色）
- **核心功能**：调用可插拔 AI 服务润色 summary / 工作描述 / 项目描述，可一键还原。
- **实现逻辑**（**不硬编码密钥**，通过 `config.polish` 注入）：
  - `config`: `{ fields: ("summary"|"work"|"projects")[]; tone?: string; polish?: (text:string, field:string)=>Promise<string> }`。
  - `onMount`：`ctx.shared.set("aipolish:original", data)` 存原稿。
  - `renderToolbar`：「AI 润色」按钮 → 置 `state.aiPolishing=true` → 逐字段 `await config.polish(text, field)` → 结果写入 `ctx.shared["aipolish:polished"]` + `state.aiPolishEnabled=true` + `forceUpdate()`；「还原」按钮清状态回原稿。
  - `transformData`（priority 50）：若 `state.aiPolishEnabled`，用 polished 覆盖对应字段。
  - 无 `config.polish` 时按钮禁用并提示「请注入润色服务」。

### 4. ExportPdf（导出 PDF）
- **核心功能**：把简历导出为 PDF（打印通道或 canvas 通道）。
- **实现逻辑**：
  - `config`: `{ method: "print" | "canvas"; fileName?: string; onBeforeExport?: ()=>void }`。
  - `renderToolbar`：「导出 PDF」按钮。
  - `method:"print"`：先 `config.onBeforeExport?.()`，给 `<body>` 加 `vc-printing` 类（PrintOptimize 的 `@media print` 规则生效），`window.print()`，结束移除类。
  - `method:"canvas"`：**dynamic import** `html2canvas` + `jspdf`（独立 chunk，不进根入口），对 `ctx.refs.getContainer()` 截图拼页，调用 `doc.save(fileName)`。
  - 触发前后 `ctx.bus.emit("resume:export", {method})` 供 PrintOptimize 协同。

### 5. MultiLang（多语言）
- **核心功能**：在预设语言间切换，整体翻译文本字段（含降级回退）。
- **实现逻辑**：
  - `config`: `{ locales:{code,label}[]; default?:string; detect?:()=>string; translations: Record<locale, DeepPartial<ResumeData>> }`。
  - `onMount`：初值 = `config.detect?.() ?? config.default ?? locales[0].code`；`state.lang=code`。
  - `renderToolbar`：语言选择器；`onChange` → `state.lang` + `bus.emit("resume:lang-change")` + `forceUpdate()`。
  - `transformData`（priority 52，管道首位）：把 `translations[lang]` 深合并进 data；缺失字段保留原文（降级）。

### 6. Versioning（版本管理）
- **核心功能**：快照当前「数据 + 模板 + 语言 + 隐私态」，保存为命名版本，可恢复 / 对比 / 删除，持久化到 localStorage 或注入的存储适配器。
- **实现逻辑**：
  - `config`: `{ storage?: "local" | StoreAdapter; maxVersions?: number }`。
  - `onMount`：从 storage 载入 `state.versions`；`bus.on("resume:version:save", save)` 等。
  - `renderToolbar`：「保存版本」→ 弹输入取名 → 收集 `{data, template, lang, privacy}` 快照 push 并持久化。
  - `renderFooter`：显示当前版本名 + 时间；点击打开 `renderOverlay` 版本抽屉（列表 + 恢复/删除）。
  - 恢复：`bus.emit("resume:data-replace", snapshot)` → 核心 `onPropsChange`/state 接管整体替换；删除同步 storage。
  - localStorage 用 `try/catch` 包裹，隐私数据建议配合 ContactDesensitize。

### 7. DeliverTrack（投递追踪）
- **核心功能**：记录投递去向与状态（已投递 / 面试中 / offer / 拒绝），footer 显示汇总，overlay 显示时间线。
- **实现逻辑**：
  - `config`: `{ initial?: Delivery[]; onChange?:(list)=>void }`，`Delivery={company,role,date,status}`。
  - `renderFooter`：渲染状态 chips（各状态配色，符合 ADR-13 对比度）。
  - `renderOverlay`：时间线面板；支持 `bus.emit("resume:deliver:add", item)` 程序化添加。
  - 状态变更写 `state.deliveries` 并调 `config.onChange`。

### 8. AttachmentPreview（附件预览）
- **核心功能**：展示附件卡片（PDF/图片/链接），点击在灯箱 overlay 中预览。
- **实现逻辑**：
  - `config`: `{ items?: AttachmentItem[]; maxPreviewSize?: number }`。
  - `transformData`：确保 `data.attachments` 存在（合并 `config.items`）。
  - `renderAttachments`：网格卡片（类型图标 + 名称 + 大小）；点击 → `state.previewItem=item` + `forceUpdate()`。
  - `renderOverlay`：灯箱——image 用 `<img>`、pdf 用 `<iframe>`（沙箱）、link 用跳转；object URL 在关闭时 `revokeObjectURL`。

### 9. ContactDesensitize（联系方式脱敏）
- **核心功能**：对电话/邮箱/地址做可逆脱敏（138****1234、a***@x.com），公开分享时保护隐私。
- **实现逻辑**：
  - `config`: `{ mode:"mask"|"hide"|"show"; fields?: ContactItem["type"][]; masks?: Record<type,(v)=>string> }`。
  - `state.contactMode` 默认 `mask`；`renderToolbar` 提供切换（与 PrivacyMask 解耦：本插件改**显示值**，PrivacyMask 改**整体视图**）。
  - `transformData`（priority 48，管道末位）：`mode!=="show"` 时对 `basics.contacts` 应用脱敏函数（缺省提供 phone/email/address 脱敏器，允许 `config.masks` 覆盖）。`mode:"hide"` 直接置空。

### 10. PrintOptimize（打印/分页优化）
- **核心功能**：注入打印样式，控制分页不断行、隐藏工具条/遮罩、按 A4 出页；与 ExportPdf 协同。
- **实现逻辑**：
  - `config`: `{ pageSize:"A4"; margin?: string; hideOnPrint?: string[] }`。
  - `onMount`：向 `ctx.refs.container` 作用域内注入 `<style media="print">`：`.vc-toolbar{display:none}`、`section{page-break-inside:avoid}`、`@page{size:A4;margin}`。
  - `transformProps`：加 `vc-print-ready` class。
  - 监听 `bus.on("resume:export", ...)` 确保导出前样式已激活。

### 11. SectionReorder（板块拖拽重排）
- **核心功能**：拖拽调整板块顺序（basics/work/edu/skills/projects/extra）。
- **实现逻辑**：
  - `config`: `{ sections: SectionKey[] }`。
  - `state.sectionOrder`（初值 = `config.sections`）；`renderToolbar`「重排」进编辑态。
  - `transformProps`：为每个板块容器注入 `data-section-key` 与拖拽手柄（仅在编辑态）；`onDrop` → 更新 `state.sectionOrder` + `forceUpdate()`。
  - 核心 `ResumeCore` 渲染板块时按 `state.sectionOrder` 遍历。

### 12. ThemeCustomize（主题配色定制）
- **核心功能**：用户选强调色 / 字体 / 间距，作为 CSS 变量注入容器。
- **实现逻辑**：
  - `config`: `{ presets?: {id,label,vars:Record<string,string>}[]; default?: string }`。
  - `renderToolbar`：色板 + 预设按钮。
  - `transformProps`（priority 20，管道首位）：把 `state.theme` 展开为 `style={{"--vane-resume-accent":..., ...}}` 注入容器；与 TemplateSwitch 的 `vc-tpl-*` class 叠加生效。

### 13. ShareLink（在线简历分享链接）
- **核心功能**：生成可分享链接（带编码数据或指向宿主），复制 + 展示二维码。
- **实现逻辑**：
  - `config`: `{ baseUrl?: string; onBuildUrl?:(data)=>string|Promise<string> }`。
  - `renderToolbar`：「分享」→ 调 `config.onBuildUrl(data)`（无则把压缩 JSON 编码进 URL hash，隐私提示由 ContactDesensitize 兜底）→ 弹 `renderOverlay` 模态：链接 + 复制按钮 + 经 QrCode 插件（若有）或内联渲染二维码。
  - 无宿主时明确提示「数据含在链接中」。

### 14. QrCode（联系方式二维码）
- **核心功能**：把联系方式 / 链接编码为二维码，作头像角标或 footer 徽章。
- **实现逻辑**：
  - `config`: `{ content?: string | ()=>string; position:"avatar"|"corner"|"footer"; size?: number }`。
  - **dynamic import** `qrcode` 生成 dataURL（独立 chunk）。
  - `renderOverlay`（position=corner/avatar）：绝对定位角标；footer 时并入 `renderFooter`。
  - 内容缺省取 `basics.contacts` 拼接 vCard 字符串。

### 15. TimelineView（时间轴可视化）
- **核心功能**：把 work/education 从列表切换为竖向时间轴（圆点 + 连线 + 日期）。
- **实现逻辑**：
  - `config`: `{ sections:("work"|"education")[]; mode:"list"|"timeline" }`。
  - `renderToolbar`：列表/时间轴切换 → `state.timelineMode`。
  - `renderWork` / `renderEducation`（**内容覆盖槽**，priority 22）：当 `state.timelineMode==="timeline"` 时返回时间轴子树，**覆盖核心默认列表**；否则返回 `null`（核心默认渲染生效）。
  - 时间轴 DOM 自带 `color`+`background`（ADR-13），圆点/连线用 token 色。

### 16. KeywordHighlight（关键词高亮）
- **核心功能**：按 JD/关键词集合，把简历文本中的命中词高亮，辅助定制与 ATS 自检。
- **实现逻辑**（**state 驱动，不抢槽**）：
  - `config`: `{ keywords: string[] | ()=>string[]; color?: string }`。
  - `renderToolbar`：「高亮关键词」输入/切换 → `state.highlightKeywords = Set(...) + forceUpdate()`。
  - 核心文本渲染统一走 `highlight(text, ctx)` 辅助函数：遍历 `state.highlightKeywords`，用转义正则包裹 `<mark class="vc-kw">`；无命中原样返回。**不与 TimelineView 抢槽**，故两者可同时启用。

### 17. AtsScore（ATS 兼容性评分）
- **核心功能**：扫描 ATS 常见雷区（关键词缺失、图片内文本、字体异常、联系方式在页眉、篇幅过长等），给分 + 建议。
- **实现逻辑**：
  - `config`: `{ rules?: Rule[]; jobKeywords?: string[] }`。
  - `transformData`（priority 44）：纯分析，写 `ctx.shared["ats:report"] = {score, issues[]}`，**不改数据**。
  - `renderFooter`：显示评分徽章（如 82）；点击 → `renderOverlay` 面板列出问题与改进建议。非阻塞。

### 18. StatSummary（简历数据概览徽章）
- **核心功能**：在 basics 区附加快速统计：工作年数 / 技能数 / 项目数 / 最高学历。
- **实现逻辑**：
  - `config`: `{ items?: ("expYears"|"skillCount"|"projectCount"|"eduLevel")[] }`。
  - `renderBasics`（装饰累积槽）：从 data 计算指标，渲染小 chip 组；空配置时输出默认四项。

### 19. SectionCollapse（板块折叠展开）
- **核心功能**：每个板块头部加折叠开关，折叠态隐藏正文（长简历 / 打印控制）。
- **实现逻辑**（**state 驱动**）：
  - `config`: `{ defaultCollapsed?: SectionKey[]; sections: SectionKey[] }`。
  - `renderToolbar`：「折叠模式」开关 → `state.collapseMode`；点击板块头部切换 `state.collapsed` Set。
  - 核心板块头部直接读取 `state.collapseMode/collapsed` 渲染折叠按钮与收起正文（与 KeywordHighlight 同理，不抢槽，可与 TimelineView 并存）。

### 20. SignatureStamp（电子签名落款）
- **核心功能**：文末加签名（姓名/图片 + 日期），可选「印章」图形。
- **实现逻辑**：
  - `config`: `{ name?: string; image?: string; date?: ()=>string; stamp?: "none"|"seal" }`。
  - `renderFooter`：签名行 + 日期。
  - `renderOverlay`（`stamp:"seal"`）：CSS 绘制的圆形印章（确认/真实感），绝对定位 footer 右侧。

---

## 6. 依赖与体积预算

- `react`/`react-dom`：`peerDependencies`（进 dependencies 直接 FAIL）。
- `vane-plugin-core`：`peerDependencies: workspace:*`（peer 外部化派）。
- `qrcode`、`jspdf`、`html2canvas`：`dependencies`，**全部 dynamic import** → 独立 chunk，不计入根入口 `sizeBudgetKb`。
- 根入口预算 `sizeBudgetKb` 默认 30（模板值），插件走子路径；若超，优先「真减」（根入口不桶导出、显式导入、重依赖动态 import），必要时改口径 + 写 `sizeBudgetNote`。
- 体积门只在 `dist/index.js` 存在时量 → 先 `vite build --mode lib` 再 `check-packages.mjs`。

## 7. 安全与合规（自检清单落点）

- **无硬编码密钥**：AiPolish 的 AI 服务经 `config.polish` 注入；ShareLink 的宿主经 `config.onBuildUrl` 注入。
- **XSS**：所有用户文本经 React 受控渲染；`<mark>` 包裹用 ReactNode 而非 `dangerouslySetInnerHTML`；正则对关键词 `escapeRegExp`。
- **隐私**：ContactDesensitize / PrivacyMask / ShareLink 默认不直接泄露明文联系方式；ShareLink 无宿主时明确提示。
- **可访问性（ADR-13）**：容器自带 `color`+`background`；内联 background 必内联 color；不用 opacity 压字；正文 ≥4.5:1 / 禁用 ≥3:1 / UI ≥3:1。

## 8. 待拍板 / 下一步

- 模板视觉由 `templates.css` 提供几套，是否需独立 `ThemeCustomize` 预设？→ 实施清单默认 3 套模板 + 2 主题预设。
- ATS 规则集是否外置为可配置 JSON？→ 默认内置 8 条基础规则，`config.rules` 可扩。
- 进入 Phase 1.3+：脚手架（`pnpm new`）、核心实现、20 插件三件套、P2 DEMO、P3 文档门禁发布（见 `tasks/60-vane-resume-实施清单.md`）。
