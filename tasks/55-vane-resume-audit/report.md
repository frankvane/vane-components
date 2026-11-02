# vane-resume 组件分析报告

> 审计对象：`packages/vane-resume`（结构化简历 + 插件系统）
> 审计范围：核心渲染、装配层、20 个官方插件、测试与文档
> 方法：静态代码走查 + build 产物检查 + 现有门禁执行；安全审查按「简历数据可能来自导入 JSON / 第三方」威胁模型
> 约束：本报告只分析，不改源码

## 一、结论摘要

组件整体架构成熟：核心只负责分段布局，能力全部下沉到插件；`vane-plugin-core` 提供了运行时、依赖拓扑、错误边界与状态总线。核心文本渲染走 React 转义，未发现 `dangerouslySetInnerHTML`。

曾存在 **3 个 P0 级问题**，其中第一个会让「按文档接入」的插件整体失效：

1. **公开 API 用错 HOC**：文档与测试教用户使用 `withPlugins`，但领域槽只存在于 `withResumePlugins`。按 README 接入时，工具栏、内容覆盖槽、折叠、重排、主题等全部不生效。
2. **联系方式脱敏经 `href` 泄露原文**：插件只改显示值，链接仍保留 `mailto:` / `tel:` 原文。
3. **简历中的 URL 未做协议白名单**：`contact.href`、项目链接、附件链接可写入 `javascript:`，React 18 只告警不拦截。

> 三项 P0 已于 2026-11-02 全部修复，详见各自章节的「状态」行。

P1 集中在「隐私承诺不可靠」与「状态管道一致性」：隐私遮罩只是视觉层、分享链接默认把完整简历写进 URL、版本恢复没有接收方、二维码只在挂载时生成、AI 润色结果跨语言复用、`getSectionOrder` 闭包过期等。

> 15 项 P1 已于 2026-11-02 全部修复，状态与修复方式见第四节开头的汇总表；P2 亦已全部修复（含版本恢复的 client 渲染测试）。当前门禁：typecheck 通过 / lint 0 error / test 31/31 / build 通过。

## 二、架构与数据流

```text
ResumeCore (forwardRef)
  ├─ useResumeContext() ──► 读取 ctx.data / ctx.state
  ├─ useResumeSlot()      ──► 装饰累积槽（toolbar/basics/attachments/footer）
  └─ useResumeContentSlot() ──► 内容覆盖槽（work/education/skills/projects/extra）

withResumePlugins(HOC)
  ├─ usePluginRuntime()   ──► state / bus / shared / manager / transformData
  ├─ transformData 链      ──► props.data → 多语言 → 润色 → 脱敏 → 隐私 → ATS
  ├─ ResumeSlotProvider   ──► 把 orderedPlugins + domainContext 下发给 ResumeCore
  └─ children             ──► renderHeader / renderOverlay + ErrorBoundary
```

关键文件：

- 核心渲染：[ResumeCore.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx)
- 领域装配：[withPlugins.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx)
- 槽位解析：[slots.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/slots.tsx)
- 领域类型：[types.ts](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/types.ts)
- 内核运行时：[usePluginRuntime.ts](file:///E:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts)

设计上值得肯定的点：

- `usePluginRuntime` 对 `props` / `data` 做浅比较，避免父组件每渲染都重建 context（[usePluginRuntime.ts:154-181](file:///E:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L154-L181)）。
- 领域 `extendContext` 用 `useCallback` 稳定（[withPlugins.tsx:48](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx#L48)）。
- 每个插件槽位都有 `PluginErrorBoundary`，单个插件异常不会炸整页（[slots.tsx:84-104](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/slots.tsx#L84-L104)）。
- 依赖拓扑优先于 priority，避免「脱敏跑在翻译之前」这类顺序错误（[DependencyResolver.ts:19-61](file:///E:/react-plugin-component/packages/plugin-core/src/dependency/DependencyResolver.ts#L19-L61)）。

## 三、P0 问题

### P0-1 公开 `withPlugins` 与领域槽不匹配（功能整体失效）

> **状态：已修复（2026-11-02）**。`src/index.ts`、`src/entries/core.ts`、`src/entries/plugins.ts` 的 `withPlugins` 均改为 `withResumePlugins` 的别名，内核通用版不再从本包导出；README / docs 现有写法因此自动变为正确，无需改文档。新增回归测试「公开 withPlugins 挂载领域槽（renderToolbar 可见）」，门禁 typecheck / lint(0 error) / test(7/7) / build 全绿。

**证据**

- 修复前根入口从内核再导出通用 HOC（`export { withPlugins, ... } from "vane-plugin-core"`，该行已移除）；现公开别名见 [index.ts:9-15](file:///E:/react-plugin-component/packages/vane-resume/src/index.ts#L9-L15)。
- 领域槽只在 `withResumePlugins` 里挂 `ResumeSlotProvider`：[withPlugins.tsx:127-137](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx#L127-L137)。
- 内核 `withPlugins` 只组装 `renderHeader` / `renderOverlay` / `renderFooter` / `children`：[plugin-core/withPlugins.tsx:53](file:///E:/react-plugin-component/packages/plugin-core/src/react/withPlugins.tsx#L53)。
- 文档全部使用该 API（现已是领域别名，无需改动）：[README.md:29-36](file:///E:/react-plugin-component/packages/vane-resume/README.md#L29-L36)、[api.md:22-28](file:///E:/react-plugin-component/docs/components/vane-resume/api.md#L22-L28)、[recipes.md:6-10](file:///E:/react-plugin-component/docs/components/vane-resume/recipes.md#L6-L10)。
- 测试原用错 HOC 且只断言姓名；现改为从根入口导入并新增领域槽断言：[resume.test.tsx:31-50](file:///E:/react-plugin-component/packages/vane-resume/test/resume.test.tsx#L31-L50)。

**影响**

- `renderToolbar`、`renderBasics`、`renderWork`、`renderEducation`、`renderSkills`、`renderProjects`、`renderExtra`、`renderAttachments` 不会渲染；20 个官方插件的 UI 入口基本消失。
- `ResumeCore` 内 `useResumeContext()` 为 `null`（[ResumeCore.tsx:59](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L59)），依赖 `ctx.state` 的折叠、重排、关键词高亮、模板/主题变量全部失效。
- 用户按「30 秒上手」接入后，只会看到裸简历，容易误判为插件没生效。

**修复建议**

- 在 `src/index.ts` 与 `src/entries/core.ts` 把公开 `withPlugins` 指向 `withResumePlugins`；内核通用版改为 `withCorePlugins` 或不再从本包导出。
- 同步修改 README、`docs/components/vane-resume/{index,api,recipes}.md` 与测试。
- 增加断言：装配 `createTemplateSwitchPlugin()` 后 DOM 必须包含模板按钮文本；装配 `createSectionCollapsePlugin()` 后必须出现折叠按钮。

### P0-2 联系方式脱敏保留原始 `href`

> **状态：已修复（2026-11-02）**。`ContactDesensitizePlugin` 在 mask / hide 模式下同步移除 `href`；新增用例断言装配后 HTML 不含原始邮箱、手机号与 `mailto:` / `tel:`。

**证据**

- 修复前脱敏只替换 `value`，其余字段原样保留；修复点在 [ContactDesensitizePlugin/create.tsx:39-46](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ContactDesensitizePlugin/create.tsx#L39-L46)。
- 修复前核心把 `c.href` 直接渲染为链接；现统一走 `safeHref`：[ResumeCore.tsx:319-332](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L319-L332)。

**影响**

显示为 `z***@example.com`，但点击/复制链接仍是 `mailto:zhangsan@example.com`；手机号同理。脱敏插件的核心承诺被绕过。

**修复建议**

- 脱敏时同步移除或重写 `href`（邮箱/电话改为 `undefined`；确需保留时生成不含原文的占位链接）。
- `hide` 模式下同时删除 `href`、`value`，避免任何原文残留。
- 增加测试：断言输出 HTML 不含原始邮箱/手机号子串。

### P0-3 简历 URL 未做协议白名单

> **状态：已修复（2026-11-02）**。新增 `safeHref`（仅放行 http/https/mailto/tel 与相对路径），已接入 `ResumeCore` 的联系方式 / 项目链接 / 附件链接，以及 `AttachmentPreviewPlugin` 的 `<a>` 与 `<iframe src>`；用例覆盖 `javascript:`、`data:text/html`、`vbscript:`、大小写与换行混淆。

**证据**

- 联系方式：[ResumeCore.tsx:319-332](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L319-L332)。
- 项目链接：[ResumeCore.tsx:450-457](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L450-L457)。
- 附件链接：[ResumeCore.tsx:520-524](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L520-L524)。
- 附件灯箱：[AttachmentPreviewPlugin/create.tsx:91-93](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AttachmentPreviewPlugin/create.tsx#L91-L93)。
- React 18.3 仅 dev 告警，不阻断 `javascript:`：[react-dom.development.js:647-656](file:///E:/react-plugin-component/packages/vane-resume/node_modules/react-dom/cjs/react-dom.development.js#L647-L656)。

**影响**

简历数据通常来自用户导入/第三方接口。恶意数据可写入 `javascript:` 链接，诱导点击后执行脚本或跳转钓鱼页；附件 `target="_blank"` 已带 `rel="noreferrer"`，但协议本身仍危险。

**修复建议**

- 增加 `safeHref(url)` 工具：仅允许 `http:`、`https:`、`mailto:`、`tel:`（以及可选相对路径），其余返回 `undefined`。
- 在核心三处链接与 `AttachmentPreviewPlugin` 的 `<a>` / `<iframe src>` 统一使用。
- 测试覆盖 `javascript:`、`data:text/html`、`vbscript:`、大小写/空白混淆。

## 四、P1 问题

> **状态：P1-1 ~ P1-15 已于 2026-11-02 全部修复。** 下列条目保留修复前的审计记录，具体修复方式见汇总表；回归测试见 `test/resume.test.tsx` 的「P1 回归」（新增 8 条）。

| 编号 | 状态 | 修复方式 | 主要位置 |
| --- | --- | --- | --- |
| P1-1 | ✅ 已修复 | `withResumePlugins` 监听 `resume:data-replace` 做内部数据覆盖，宿主回写 `props.data` 后自动撤销；Versioning 恢复时同步还原 `template/lang/privacyOn` 并回调 `onRestore` | [withPlugins.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx)、[VersioningPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/VersioningPlugin/create.tsx) |
| P1-2 | ✅ 已修复 | blur/hide 两种模式都做数据级隐藏（简介占位、contacts 清空）；文档与 demo 明确「毛玻璃不防复制/导出」 | [PrivacyMaskPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/PrivacyMaskPlugin/create.tsx) |
| P1-3 | ✅ 已修复 | 以 vCard 内容为签名，内容变化即重建；`requestId` 竞态取消；隐私模式 vCard 不含联系方式 | [QrCodePlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/QrCodePlugin/create.tsx) |
| P1-4 | ✅ 已修复 | 缓存只存润色片段并携带 `lang`，仅当前语言命中时叠加；不再整份 data 回放 | [AiPolishPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AiPolishPlugin/create.tsx) |
| P1-5 | ✅ 已修复 | 默认只返回 `baseUrl` / origin，不再内联 `#r=base64`；UI 提示 base64 不是加密 | [ShareLinkPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ShareLinkPlugin/create.tsx) |
| P1-6 | ✅ 已修复 | 新增 `storageKey` / `storage` 适配器 / `onStorageError`，写失败在弹层内提示；文档注明数据留在本地 | [VersioningPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/VersioningPlugin/create.tsx) |
| P1-7 | ✅ 已修复 | `ctxRef` / `propsRef` 在调用时读取最新值；`useImperativeHandle` 依赖收敛为 `containerRef` | [ResumeCore.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx) |
| P1-8 | ✅ 已修复 | 内容槽 fallback 改工厂惰性求值；`useResumeContentSlot` 仅依赖 `orderedPlugins/context/slot` | [slots.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/slots.tsx) |
| P1-9 | ✅ 已修复 | `onPropsChange` 对 props 浅比较，忽略 `children` / `containerRefExternal`，首次渲染不触发 | [withPlugins.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx) |
| P1-10 | ✅ 已修复 | `onMount` effect 依赖插件集合（`runtime.orderedPlugins`），重建后重跑，打印样式可重新装回 | [withPlugins.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx) |
| P1-11 | ✅ 已修复 | 按 type 归一化：手机剔非数字并去 `+86`，邮箱按最后一个 `@` 且本地/域名均遮罩，短文本全隐藏 | [ContactDesensitizePlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ContactDesensitizePlugin/create.tsx) |
| P1-12 | ✅ 已修复 | iframe 加 `sandbox="allow-scripts"`（不含 `allow-same-origin`）、`referrerPolicy="no-referrer"`、`loading="lazy"` | [AttachmentPreviewPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AttachmentPreviewPlugin/create.tsx) |
| P1-13 | ✅ 已修复 | `useCORS` / `allowTaint=false` / `imageTimeout` + 图片预加载；导出前隐藏工具栏与弹层；隐私遮罩存在时拒绝导出；失败以 `role="alert"` 提示 | [ExportPdfPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ExportPdfPlugin/create.tsx) |
| P1-14 | ✅ 已修复 | 改为静态字面量 `import("html2canvas")` / `import("jspdf")`；build 产物已是静态 `import("./html2canvas…")` | [ExportPdfPlugin](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ExportPdfPlugin/create.tsx) |
| P1-15 | ✅ 已修复 | 新增共用 `Overlay`（`role=dialog` / `aria-modal` / Escape / 焦点环 / backdrop），全部官方弹层接入；ATS / 投递入口改原生 `button` 并带 `aria-expanded` | [overlay.tsx](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/overlay.tsx) |

### ✅ P1-1 版本「恢复」没有接收方，实际不改数据

[VersioningPlugin/create.tsx:119-122](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/VersioningPlugin/create.tsx#L119-L122) 恢复时只 `bus.emit("resume:data-replace", v)`。全包仅此一处出现该事件，demo 也未订阅（Grep 已核实）。结果是版本名切换、简历内容不变。

建议：核心或 `withResumePlugins` 监听该事件并更新受控数据，或由插件保存 `props.onDataChange` 回调走宿主回写；文档明确「恢复需宿主实现」并在 demo 演示。

### ✅ P1-2 隐私遮罩只是视觉层，且导出可能绕过

[PrivacyMaskPlugin/create.tsx:55-68](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/PrivacyMaskPlugin/create.tsx#L55-L68) 用 `backdropFilter` + `pointerEvents:none`。DOM 中仍是明文，可选中、复制、被读屏读取；html2canvas 对 `backdrop-filter` 支持不可靠，`ExportPdfPlugin` 可能导出未遮罩画面。文档却称「防截图 / 分享泄露」（[08-privacy-mask.tsx:9](file:///E:/react-plugin-component/packages/vane-resume/demo/src/demos/08-privacy-mask.tsx#L9)）。

建议：隐私模式改为数据级隐藏（与 `mode:"hide"` 合并），或在导出/分享前强制替换数据；明确「视觉遮罩不防复制/导出」。

### ✅ P1-3 二维码只在挂载时生成

[QrCodePlugin/create.tsx:44-61](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/QrCodePlugin/create.tsx#L44-L61) 只在 `onMount` 读取一次 `ctx.data`。切换语言、联系方式脱敏、隐私模式后，二维码仍编码旧 vCard（含明文联系方式）。

建议：监听 `lang` / `contactMode` / `privacyOn` 或 `resume:data-replace` 重新生成；生成期间做竞态取消（记录 request id）。

### ✅ P1-4 AI 润色结果跨语言复用，污染后续管道

[AiPolishPlugin/create.tsx:38-42](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AiPolishPlugin/create.tsx#L38-L42) 只要 `aiPolishEnabled` 为真就返回缓存的 `polished`，与当前 `lang` 无关；切换语言后仍显示上一语言的润色文本。同时润色输入是 `ctx.data`（已转换数据），产生的结果会叠加在脱敏/隐私之前，后续开关切换容易看到「混合状态」。

建议：缓存键加入 `lang` 与源数据版本；关闭或切换语言时清空缓存；明确润色在翻译之后、脱敏之前的管道位置。

### ✅ P1-5 分享链接默认把完整简历写入 URL

[ShareLinkPlugin/create.tsx:14-21,31](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ShareLinkPlugin/create.tsx#L14-L21) 默认 `#r=base64(JSON)`，包含姓名、电话、邮箱、住址等 PII。URL 会进入浏览器历史、剪贴板、聊天记录与浏览器同步。

建议：默认不内联数据，要求显式 `onBuildUrl`；或至少默认使用脱敏后的数据并提示长度/隐私风险；`base64` 不是加密，文档避免暗示「安全分享」。

### ✅ P1-6 版本快照明文持久化且全局共享

[VersioningPlugin/create.tsx:23-41](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/VersioningPlugin/create.tsx#L23-L41) 用固定 key `vane-resume-versions` 写 localStorage：

- 同源多个简历实例共用同一历史，互相覆盖。
- 简历 PII 长期明文留存，无清理策略。
- `setItem` 失败被静默吞掉，UI 仍显示「已保存」。

建议：key 加实例 id / 用户 id；提供 `storage` 适配器与容量错误回调；文档明确数据留在本地。

### ✅ P1-7 `getSectionOrder` 闭包捕获首帧 ctx

[ResumeCore.tsx:70-86](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L70-L86) 的 `useImperativeHandle` 只依赖 `props.defaultSectionOrder`。首次渲染时插件 `onMount` 尚未写入 `sectionOrder`，闭包永久返回默认顺序；`SectionReorder` 之后 `ref.getSectionOrder()` 仍是旧值。

建议：依赖加入 `ctx` 或把 `ctx` 放进 ref，在调用时读取最新值。

### ✅ P1-8 内容槽 fallback 每渲染重算

[ResumeCore.tsx:119-140](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L119-L140) 在渲染阶段先构造默认节点；[slots.tsx:175-189](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/slots.tsx#L175-L189) 的 `useMemo` 依赖含每次新建的 `fallback`，导致：

- 即使插件覆盖了该槽，默认 DOM 仍被白白创建。
- 每次宿主渲染都会重新调用插件的内容渲染钩子，`useMemo` 形同虚设。

建议：`useResumeContentSlot(slot, () => fallback)` 惰性求值；依赖项去掉元素本身，仅在 `context/orderedPlugins` 变化时重算。

### ✅ P1-9 `onPropsChange` 每次宿主渲染都触发

[withPlugins.tsx:94-101](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx#L94-L101) 用 `prev !== props` 判断。React 每次渲染都会创建新的 props 对象，因此该条件恒为真，`onPropsChange` 钩子会被高频调用，插件若在此做重计算会放大开销。

建议：对关心的 key 做浅比较（排除 `children` 等每次新建字段），或由 `usePluginRuntime` 提供稳定的 `prevProps`。

### ✅ P1-10 插件数组变化时不重跑 `onMount`

[usePluginRuntime.ts:124-131](file:///E:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L124-L131) 在插件数组变化时 `clear()` 后重注册，但 `withResumePlugins` 的 `onMount` 只在挂载 effect 执行一次（[withPlugins.tsx:87-90](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx#L87-L90)）。`PrintOptimizePlugin` 的 `<style>` 会被清理且不再装回，打印优化静默失效。

建议：注册完成后对新增插件执行 `onMount`，或把生命周期收归 `usePluginRuntime` 统一管理；demo 中 `withResumePlugins` 每次 `cfg` 变化都会重建 HOC（[_factory.tsx:129-133](file:///E:/react-plugin-component/packages/vane-resume/demo/src/demos/_factory.tsx#L129-L133)），更容易触发。

### ✅ P1-11 默认脱敏规则覆盖不足

[ContactDesensitizePlugin/create.tsx:20-33](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ContactDesensitizePlugin/create.tsx#L20-L33)：

- 电话只匹配连续 11 位，`+86 138-0013-8000` 不命中。
- 地址/社交的 `(.{4}).*(.{4})` 对短文本不匹配，直接明文。
- 邮箱按第一个 `@` 切分，异常值会露出域名结构。

建议：按 `type` 使用更宽容的归一化脱敏；无法匹配时回退为全隐藏；增加对应单测。

### ✅ P1-12 附件 iframe 未加 sandbox

[AttachmentPreviewPlugin/create.tsx:91](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AttachmentPreviewPlugin/create.tsx#L91) 直接把 `item.url` 放进 `<iframe>`，没有 `sandbox`、`referrerPolicy`、`allow`。不可信 PDF/网页可弹窗、导航顶层、发起下载。

建议：默认 `sandbox="allow-scripts"`（不加 `allow-same-origin`），并按需开放权限；`referrerPolicy="no-referrer"`。

### ✅ P1-13 canvas 导出易失败且范围不纯

[ExportPdfPlugin/create.tsx:26-45](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ExportPdfPlugin/create.tsx#L26-L45)：

- 跨域头像/二维码会使 canvas 污染，`toDataURL` 抛 `SecurityError`，最终回退整页打印。
- 导出根容器包含工具栏与覆盖层；隐私遮罩不保证被渲染。
- 未等待图片加载完成。

建议：`useCORS: true` + 图片预加载；导出前临时加 `data-vr-exporting` 隐藏工具栏/遮罩；失败提示而非静默打印。

### ✅ P1-14 导出插件动态导入变量化

[ExportPdfPlugin/create.tsx:16-17,26-27](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ExportPdfPlugin/create.tsx#L16-L27) 用变量承载裸模块名。dist 保留 `import(C)` / `import(D)`（[create-3t7JVIpA.js:36-41](file:///E:/react-plugin-component/packages/vane-resume/dist/chunks/create-3t7JVIpA.js#L36-L41)），部分打包器无法静态解析，运行时才报 `Cannot find module`。

建议：改为静态字面量 `import("html2canvas")` / `import("jspdf")` 并在构建中外部化；或在 README 明确「需消费者自行安装并保证可解析」。

### ✅ P1-15 弹层与工具入口的可访问性不足

- 多数 overlay 是 `<div onClick>`，无 `role="dialog"`、`aria-modal`、焦点陷阱、Escape 关闭（如 [AtsScorePlugin:144-168](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AtsScorePlugin/create.tsx#L144-L168)、[PrivacyMaskPlugin:52-83](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/PrivacyMaskPlugin/create.tsx#L52-L83)）。
- ATS 评分入口是 `<span onClick>`（[AtsScorePlugin:122-125](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AtsScorePlugin/create.tsx#L122-L125)），键盘不可达。
- 附件按钮缺少 `aria-haspopup` 状态。

建议：抽出 `Overlay` 基础组件，统一 `role=dialog`、Escape、焦点回收；入口使用原生 `button`。

## 五、P2 问题

> 状态：P2-1 ~ P2-11 已于 2026-11-02 全部修复。测试已扩到 31 条，其中 P2-8 补充了版本「保存快照 → 恢复」的 client 渲染闭环（`createRoot` + `act`），并补强插件渲染抛错隔离与插件集合变化后的副作用恢复。

| # | 状态 | 问题 | 证据 | 建议 |
| --- | --- | --- | --- | --- |
| P2-1 | ✅ 已修复 | DeliverTrack 在 `onMount` 注册 bus 监听且不返回清理，回调闭包持有旧 `ctx.state`，bus 新增记录会用旧列表覆盖 | [DeliverTrackPlugin:41-46](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/DeliverTrackPlugin/create.tsx#L41-L46) | 已改为 `shared` 存列表真源 + 返回取消订阅 cleanup；新增回归测试 |
| P2-2 | ✅ 已修复 | 弹层无 dialog 语义 / 焦点管理 / Escape；ATS 入口是 `<span onClick>` | [AtsScorePlugin:117-138](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/AtsScorePlugin/create.tsx#L117-L138) | 已随 P1-15 接入 `Overlay` 并改原生 `button` |
| P2-3 | ✅ 已修复 | Timeline 模式直接输出文本，关键词高亮、脱敏后的 `href` 等核心能力丢失 | [TimelineViewPlugin:88-95](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/TimelineViewPlugin/create.tsx#L88-L95) | 已复用 `highlightText`，公司/职位/学历/亮点均支持关键词高亮；新增回归测试 |
| P2-4 | ✅ 已修复 | MultiLang 只做顶层浅合并；`locales` 为空时 `locales[0].code` 抛错 | [MultiLangPlugin:21-47](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/MultiLangPlugin/create.tsx#L21-L47) | 工厂入口校验 `locales` 非空且 `translations` 存在，缺失时抛出明确错误；`applyLocale` 对 `basics` 深合并，仅翻译 name/title 时保留 contacts 等原字段；新增回归测试 |
| P2-5 | ✅ 已修复 | `DEFAULT_SECTION_ORDER` 可变导出；`SectionReorder` 文案写「拖拽」实际只有上下按钮 | [types.ts:117-125](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/types.ts#L117-L125)、[index.ts:49-50](file:///E:/react-plugin-component/packages/vane-resume/src/index.ts#L49-L50)、[SectionReorderPlugin:61](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/SectionReorderPlugin/create.tsx#L61) | 文案已改为「上移/下移排序」；常量改为 `readonly SectionKey[]` + `Object.freeze`；根入口此前误放在 `export type` 块中（运行期会丢失），现改为值导出；新增冻结回归测试 |
| P2-6 | ✅ 已修复 | 无数据时仍渲染空的「基本信息」段 | [ResumeCore.tsx:264-274](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L264-L274) | `case "basics"` 在默认内容为 `null` 且 `basicsSlot` 为空时直接返回 `null`，不再输出空段；新增 SSR 回归测试 |
| P2-7 | ✅ 已修复 | ShareLink 使用已废弃 `unescape`；剪贴板失败未反馈；`onBuildUrl` 拒绝未捕获 | [ShareLinkPlugin:16-19,59-63](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/ShareLinkPlugin/create.tsx#L16-L19) | 已删除 `unescape` 与内联逻辑，补复制状态与异常提示 |
| P2-8 | ✅ 已修复 | 测试仅 6 条，未覆盖槽位装配、隐私、协议过滤、版本恢复、SSR | [resume.test.tsx:455-521](file:///E:/react-plugin-component/packages/vane-resume/test/resume.test.tsx#L455-L521) | 已扩到 28 条并补强至 31 条；新增 `createRoot` + `act` 的 client 渲染用例：从 `localStorage` 载入快照 → 打开版本列表 → 点击「恢复」→ 简历姓名从「张三」切到快照「李四」，且 `template/lang/privacyOn` 一并还原 |
| P2-9 | ✅ 已修复 | `AiPolish` 的 `CONTACT_FIELDS` 未使用；`containerRefExternal` 类型为 `RefObject` 但实际传可变 ref | [types.ts:142](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/types.ts#L142)、[ResumeCore.tsx:56-59](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L56-L59) | `CONTACT_FIELDS` 已删除；`containerRefExternal` 改为 `RefObject<HTMLDivElement \| null>`，可接收宿主 `useRef<HTMLDivElement \| null>(null)`；核心内部 ref 在挂载处做型变收窄，typecheck 通过 |
| P2-10 | ✅ 已修复 | `renderWorkDefault` 等默认渲染每次 Re-render 重建；`highlightText` 每次编译正则 | [ResumeCore.tsx:341-370](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/ResumeCore.tsx#L341-L370)、[tokens.tsx:53-80](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/tokens.tsx#L53-L80) | 默认节点按数据片段 + 关键词签名 `useMemo`，槽位按 fallback 标识缓存节点；RegExp 按关键词签名缓存并重置游标 |
| P2-11 | ✅ 已修复 | `PrintOptimizePlugin` 的 `hideOnPrint` 不覆盖 overlay；打印时打开弹层会一起打印 | [PrintOptimizePlugin:17,40-49](file:///E:/react-plugin-component/packages/vane-resume/src/custom-plugins/PrintOptimizePlugin/create.tsx#L17-L49) | 默认隐藏列表加入 `[data-vr-overlay]`；`onMount` 返回 cleanup，同时移除 `<style>` 并 `bus.off("resume:export")`；新增回归测试 |

## 六、安全审查清单

| 检查项 | 结论 | 证据 / 说明 |
| --- | --- | --- |
| 文本 XSS | ✅ 通过 | 全部 React 文本节点转义；全包无 `dangerouslySetInnerHTML` |
| URL 协议注入 | ✅ 通过（P0-3 已修复） | 核心三处链接与附件统一走 `safeHref`，危险协议返回 `undefined` |
| 敏感数据外发 | ✅ 默认安全 | P1-5 已修复：分享链接默认不内联简历 JSON；AI 润色仅在用户点击后调用，由宿主注入实现，无硬编码密钥 |
| 本地持久化 | ⚠️ 可配置 | P1-6 已修复 key / 存储适配 / 失败回调；快照仍为本地明文，已在文档注明 |
| 脱敏完整性 | ✅ 通过 | P0-2 已修复 `href` 泄露；P1-11 已补齐 +86 / 短文本 / 异常邮箱 |
| 隐私模式有效性 | ✅ 通过 | P1-2 已改为数据级隐藏；导出插件检测遮罩后拒绝导出 |
| iframe 隔离 | ✅ 通过 | P1-12 已加 `sandbox="allow-scripts"` + `referrerPolicy="no-referrer"` |
| 依赖与密钥 | ✅ 通过 | 无硬编码密钥；`qrcode` 为可选依赖，PDF 依赖为可选运行时加载 |
| 错误边界 | ✅ 基本通过 | 插件槽位有 `PluginErrorBoundary`；但 `resolveDependencyOrder` 循环依赖抛错未被捕获，会中断渲染 |

补充：`resolveDependencyOrder` 在循环依赖时直接 `throw`（[DependencyResolver.ts:40-42](file:///E:/react-plugin-component/packages/plugin-core/src/dependency/DependencyResolver.ts#L40-L42)），而 `withResumePlugins` 没有外层错误边界；开发期配置错误会导致整页白屏。建议在运行时包一层并展示可诊断错误。

## 七、React / 性能审查

**做得好**

- context 浅比较与 `extendContext` 稳定，避免 context 每渲染重建。
- 插件依赖拓扑与 priority 分离，排序语义清晰。
- 处理了 SSR 边界：`window` / `document` / `localStorage` / `btoa` 均有守卫。
- 关键词高亮采用文本拆分，不使用 `dangerouslySetInnerHTML`（[tokens.tsx:49-80](file:///E:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/plugins/tokens.tsx#L49-L80)）。

**需改进**

1. ✅ 内容槽 fallback 惰性化（P1-8），避免默认树白渲染与插件钩子重复执行。
2. ✅ `useImperativeHandle` 改为读取 ref（P1-7），避免闭包过期。
3. ✅ `onPropsChange` 用 keyed 浅比较（P1-9），避免每次宿主渲染触发。
4. ✅ 默认分段节点与关键词 RegExp 已缓存（P2-10）：默认节点按数据片段 + 关键词签名 `useMemo`，内容槽按 fallback 标识缓存；RegExp 按签名缓存并重置 `lastIndex`。
5. `useResumeSlot` / `useResumeContentSlot` 的 `context` 依赖会在任意 state 变化时全量重算；可按槽位拆 context 或对插件渲染做 memo（fallback 结果已由 P2-10 缓存）。

## 八、测试缺口

现有测试 31 条（[resume.test.tsx](file:///E:/react-plugin-component/packages/vane-resume/test/resume.test.tsx)）。P0/P1/P2 修复已覆盖：

1. **装配**：公开 `withPlugins` 别名挂载 `renderToolbar` 槽并渲染核心数据。
2. **协议过滤**：`javascript:` / `data:text/html` / 大小写混淆不得进入 `href` / `iframe src`。
3. **脱敏**：输出 HTML 不含原始邮箱、手机号；`href` 同步被清除。
4. **隐私模式**：数据层清空 contacts / 简介；二维码 vCard 不含明文联系方式。
5. **分享**：默认 URL 不含 `#r=` 与简历数据。
6. **AI 润色**：切换语言后不复用旧语言缓存。
7. **版本存储**：自定义 `storageKey` 生效，存储异常回调触发。
8. **附件 / 弹层**：iframe `sandbox`、Overlay `role=dialog` / `aria-modal`。
9. **SSR**：`withPlugins` 的 `renderToStaticMarkup` 不依赖 `window`。
10. **投递事件（P2-1）**：连续两次 bus 新增会累积，清理函数执行后停止监听。
11. **时间轴高亮（P2-3）**：timeline 模式下公司 / 职位 / 亮点均输出 `<mark>`。
12. **正则复用（P2-10）**：同一关键词重复高亮结果一致，无 `lastIndex` 串游标。
13. **多语言（P2-4）**：空 `locales` 抛错；仅翻译 `basics.name/title` 时 `contacts` 等原字段保留。
14. **空数据（P2-6）**：无 `data` 时不渲染「基本信息」空段，有数据时正常渲染。
15. **打印样式（P2-11）**：默认样式文本包含 `[data-vr-overlay]`，cleanup 后 `<style>` 被移除。
16. **常量只读（P2-5）**：`DEFAULT_SECTION_ORDER` 运行期被冻结，追加元素抛错。
17. **版本恢复（P2-8）**：client 渲染下「打开历史版本 → 恢复」后简历数据切换为快照内容，状态一并还原。
18. **插件渲染隔离**：同步抛错的 `renderToolbar` 被 try/catch 丢弃、渲染期抛错被 `PluginErrorBoundary` 兜底，健康的工具栏插件与核心数据照常渲染；内容槽（`renderWork`）抛错时回落到核心默认结构。
19. **插件集合变化（P1-10）**：宿主按插件集合重建装配后，`PrintOptimize` 的打印 `<style>` 仍生效且始终只保留一份（旧实例卸载清理 + 新实例重新注入）。

已补齐报告先前列出的两项可选补强，无剩余已知测试缺口。

## 九、验证记录

命令均在 `e:\react-plugin-component` 下执行，结果回填如下：

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter vane-resume typecheck` | ✅ exit 0，无输出 |
| `pnpm --filter vane-resume lint` | ✅ exit 0；**63 个 warning，0 error**（demo fast-refresh、`any`、少量未使用变量） |
| `pnpm --filter vane-resume test` | ✅ **31/31 通过**（P1 回归 8 条 + P2 回归 8 条，加版本恢复 1 条与补强 3 条）；仍有既有 SSR `useLayoutEffect` 警告与 `contact-desensitize -> ai-polish` 依赖未注册提示 |
| `pnpm --filter vane-resume build` | ✅ exit 0，456 modules，约 8.2s；dist 中 PDF 依赖为静态 `import("./html2canvas…")` / `import("./jspdf…")` |

证据复核：P1/P2 回归测试直接断言脱敏边界、分享默认值、AI 缓存语言隔离、Versioning `storageKey`、二维码隐私内容、iframe `sandbox`、Overlay 语义、投递 bus 累积与清理、时间轴高亮、正则复用；`ResumeCore` / `withPlugins` / `slots` 的修复均有对应测试或 build 产物佐证。

## 十、结论与优先级建议

- **P0-1 / P0-2 / P0-3 已全部修复**：公开 HOC 已对齐领域槽，脱敏与链接协议收敛到 `safeHref` / `maskContact`，并有单测。
- **P1 已全部修复**：隐私承诺类（P1-2/3/5/6/11/12）改为数据级 / 默认安全；状态管道类（P1-1/4/7/10）已闭环；性能与打包（P1-8/9/13/14）已收敛。
- **P2 已全部修复**：P2-1/3/10 之外，P2-4（MultiLang 空数组校验 + basics 深合并）、P2-6（空数据不渲染 basics 段）、P2-11（打印隐藏 overlay + 监听清理）、P2-9（`containerRefExternal` 兼容 `RefObject<T | null>`）、P2-5（`Object.freeze` + 根入口值导出）、P2-8（版本保存/恢复 client 渲染闭环）均已完成并有回归测试。
- **测试基线**：31/31 通过，P0/P1/P2 的修复点均有对应断言；插件渲染抛错隔离与插件集合变化后的副作用恢复已补齐，无剩余已知测试缺口。

