# vane-resume 组件分析与报告（Spec）

> 目标：审计 `packages/vane-resume` 的核心功能、安全与 React 最佳实践，产出按 P0/P1/P2 排序的分析报告。
> 约束：本批次**只分析、不改源码**；报告中的修复建议仅作为后续任务输入。

## 1. 决定（Decision）

1. 报告文件：`tasks/55-vane-resume-audit/report.md`，Markdown，中文。
2. 报告结构：结论摘要 → 架构与数据流 → P0/P1/P2 问题清单（每条含证据 file:line、影响、修复建议）→ 安全清单 → React/性能清单 → 验证命令与测试缺口。
3. 不修改 `packages/vane-resume` 任何源码、demo、README；不生成 HTML。
4. 安全审查以「简历数据可能来自导入 JSON/第三方」为威胁模型；React 18.3 仅告警不拦截 `javascript:` URL（已在 `react-dom.development.js:647-656` 核实）。
5. 使用 `security-best-practices`、`vercel-react-best-practices` 的检查项；`code-review-report-plugin` 不适用（无 Git 变更），不强行生成其交互报告。

## 2. 已核实的关键发现（写入报告）

### P0

- **公开 API 与领域槽不匹配**：`src/index.ts:44` 从 `vane-plugin-core` 再导出通用 `withPlugins`；领域槽只在 `withResumePlugins` 内提供 `ResumeSlotProvider`（`withPlugins.tsx:127-137`）。README `README.md:29-36`、`docs/components/vane-resume/api.md:22-28`、`recipes.md:6-10` 均教用户用 `withPlugins`。后果：`renderToolbar/renderBasics/renderWork/renderEducation/renderSkills/renderProjects/renderExtra/renderAttachments` 全部不渲染，`ResumeCore` 内 `useResumeContext()` 为 null（`ResumeCore.tsx:59`），折叠/重排/高亮/主题等 state 驱动能力失效。测试 `test/resume.test.tsx:33` 只断言姓名，未覆盖工具栏，故未发现。
- **脱敏插件经 href 泄露原文**：`ContactDesensitizePlugin/create.tsx:39-40` 只改 `value`，保留 `href`；核心 `ResumeCore.tsx:322` 直接渲染 `href`。手机号/邮箱打码后仍可从链接还原。
- **数据 URL 未做协议白名单**：核心 `ResumeCore.tsx:322`、`:448`、`:514-518` 把 `contact.href`、`project.links`、`attachment.url` 原样进 `href`；React 18 允许 `javascript:`（仅 dev 告警），导入型数据可触发脚本执行/钓鱼跳转。

### P1

- **版本恢复无接收方**：`VersioningPlugin/create.tsx:121` 只 `bus.emit("resume:data-replace")`；全包无监听（Grep 仅此一处），demo 也未订阅。点「恢复」后数据不变，仅版本名变化。
- **隐私遮罩只是视觉层**：`PrivacyMaskPlugin/create.tsx:55-68` 用 `backdropFilter` + `pointerEvents:none`，DOM 仍含明文，可选中/复制/读屏；`ExportPdfPlugin` 的 html2canvas 对 `backdrop-filter` 支持不可靠，导出可能得到未遮罩内容。
- **二维码不随数据更新**：`QrCodePlugin/create.tsx:44-61` 只在 `onMount` 生成；切换语言/脱敏/隐私后二维码仍指向旧明文 vCard。
- **AI 润色污染多语言与后续管道**：`AiPolishPlugin/create.tsx:38-42` 直接返回缓存 `polished`，语言切换后仍显示上一语言润色结果；润色输入是 `ctx.data`（已转换数据），与 `VersioningPlugin:91` 保存转换后快照叠加，会丢失原始数据。
- **分享链接默认把完整简历写入 URL**：`ShareLinkPlugin/create.tsx:14-21,31` 默认 `#r=base64(JSON)`，含联系方式等 PII；URL 会进历史/剪贴板/同步。
- **版本快照持久化风险**：`VersioningPlugin/create.tsx:23-41` 明文 localStorage、全局 key `vane-resume-versions`（同源多实例互串）、写入失败被静默吞掉。
- **`getSectionOrder` 闭包过期**：`ResumeCore.tsx:70-86` 的 `useImperativeHandle` 仅依赖 `defaultSectionOrder`，闭包捕获首次渲染 ctx；首次渲染时 `sectionOrder` 尚未由插件 `onMount` 写入，重排后仍返回默认顺序。
- **内容槽 fallback 每渲染重算**：`ResumeCore.tsx:119-140` 在渲染阶段先执行默认渲染，`useResumeContentSlot` 的 `useMemo` 依赖含每次新建的 `fallback`（`slots.tsx:175-189`），导致插件渲染钩子在每次宿主渲染时重新执行，默认树也白白构建。
- **`onPropsChange` 每次宿主渲染都触发**：`withPlugins.tsx:94-101` 用 `prev !== props` 比较，但 React 每次渲染都会新建 props 对象。
- **插件数组变化不重跑 onMount**：`usePluginRuntime.ts:124-131` 重注册时 `clear()` 会执行清理，但 `withResumePlugins` 的 onMount 只在挂载时执行一次；PrintOptimize 的打印样式会被清掉且不再装回。
- **默认脱敏规则覆盖不全**：`ContactDesensitizePlugin/create.tsx:20-33` 的电话仅匹配连续 11 位、地址/社交短文本不匹配，常见 `+86 138-0013-8000` 会明文展示。
- **PDF iframe 未加 sandbox**：`AttachmentPreviewPlugin/create.tsx:91` 直接 `<iframe src>`，无 `sandbox`/`referrerPolicy`，不可信附件可导航/弹窗。
- **canvas 导出易失败且可能泄露**：`ExportPdfPlugin/create.tsx:26-45` 跨域头像会使 canvas 污染、`toDataURL` 抛 SecurityError 后回退打印；导出范围含工具栏/覆盖层，且不等待图片。
- **导出插件动态导入变量化**：`create.tsx:16-17,26-27`；dist 产物保留 `import(C)`（`dist/chunks/create-3t7JVIpA.js:36-41`），消费者打包器可能无法静态解析。

### P2

- DeliverTrack `onMount` 内注册 bus 监听且不返回清理，回调闭包捕获旧 ctx.state，bus 新增记录会覆盖为旧列表（`DeliverTrackPlugin/create.tsx:41-46`）。
- 弹层无 `role="dialog"`/`aria-modal`/焦点陷阱/Escape；ATS footer 用 `<span onClick>`（`AtsScorePlugin/create.tsx:117-138`）。
- Timeline 模式丢失关键词高亮（`TimelineViewPlugin/create.tsx:88-95` 直接输出文本）。
- MultiLang 仅浅合并，缺省语言取 `locales[0].code`，空数组会抛错（`MultiLangPlugin/create.tsx:21,38`）。
- `DEFAULT_SECTION_ORDER` 可变导出；`SectionReorder` 文案称「拖拽」实际只有上下按钮（`SectionReorderPlugin/create.tsx:70`）。
- `renderBasics` 无数据时仍渲染空「基本信息」段（`ResumeCore.tsx:232-239`）。
- `ShareLink` 使用已废弃 `unescape`，`navigator.clipboard.writeText` 未处理失败（`create.tsx:16-19,59-63`）。
- 测试仅 5 条：无槽位装配、隐私/脱敏、版本恢复、SSR、协议过滤覆盖。
- `AiPolish` 的 `CONTACT_FIELDS` 未使用（`create.tsx:15-19`）；`containerRefExternal` 类型为 `RefObject` 但传入可变 ref（`types.ts:142`）。

## 3. React / 性能结论

- 正向：`usePluginRuntime` 对 `props/data` 浅比较、`extendContext` 用 `useCallback` 稳定，避免 context 每渲染重建（`usePluginRuntime.ts:39-51,154-181`）。
- 需改：内容槽改为惰性 fallback（传函数而非元素）、把插件渲染结果移出 `useMemo` 依赖、`getSectionOrder` 读 ref、`onPropsChange` 用浅比较 keyed props。
- 大数据量下 `highlightText` 每次渲染重新编译正则（`tokens.tsx:53-80`）；可按 keywords 签名缓存 RegExp。

## 4. 安全清单（security-best-practices）

| 项 | 结论 | 证据 |
| --- | --- | --- |
| XSS（文本） | 通过：全部 React 文本转义，无 `dangerouslySetInnerHTML` | 全包 Grep 无命中 |
| URL 注入 | 未通过：href/src iframe 无协议白名单 | `ResumeCore.tsx:322,448,514`；`AttachmentPreviewPlugin:91` |
| 敏感数据留存 | 未通过：分享 URL / localStorage / 二维码含 PII | `ShareLinkPlugin:14-31`；`VersioningPlugin:23-41`；`QrCodePlugin:19-35` |
| 脱敏完整性 | 未通过：href 原文泄露、正则覆盖不足 | `ContactDesensitizePlugin:20-40` |
| 隐私模式有效性 | 未通过：仅视觉遮罩 | `PrivacyMaskPlugin:55-68` |
| 外部调用 | 通过：AI 润色由宿主注入，无硬编码密钥 | `AiPolishPlugin:12,23` |

## 5. 验证方案

工作目录 `e:\react-plugin-component`：

1. `pnpm --filter vane-resume typecheck`
2. `pnpm --filter vane-resume lint`
3. `pnpm --filter vane-resume test`
4. `pnpm --filter vane-resume build`
5. 报告证据复核：`git grep -n "withResumePlugins\|withPlugins" -- packages/vane-resume/docs README.md`
6. 可选浏览器复核：`pnpm --filter vane-resume dev`，打开 `#/demo/versioning` 点「恢复」确认数据不变；打开 `#/demo/privacy-mask` 复制被遮罩文本；打开 `#/demo/contact-desensitize` 检查链接 href。

## 6. 审批

- [ ] 用户确认报告范围与「只分析、不改源码」的边界
- [ ] 用户确认 P0/P1 分级与报告文件位置

批准后按 `tasks.md` 执行：写报告 → 运行验证命令 → 回报结果。
