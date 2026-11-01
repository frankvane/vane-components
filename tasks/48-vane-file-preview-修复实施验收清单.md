# 48 · vane-file-preview 修复实施验收清单

- 日期：2026-11-01
- 依据：`tasks/39-vane-file-preview-核心功能评审.html`（1 项 P0 + 5 项 P1 + 9 项 P2，修复顺序 T01..T08）
- 范围：仅 `packages/vane-file-preview/`（源码、doc.json、test）。未修改 `packages/plugin-core`、其它包、根配置与 tasks/39 报告。
- 结论：**15 / 15 项全部修复**，无跳过项、无「阻塞：需 plugin-core 支持」。4 条验证命令全部通过（测试 283 passed / 0 failed）。

## 一、概述

### 1.1 修复策略

| 类别 | 做法 |
| --- | --- |
| P0 安全 | PDF / Office iframe 一律加 `sandbox` + `referrerPolicy="no-referrer"`；PDF 默认 `allow-scripts`（**不含** `allow-same-origin`），并暴露 `sandbox` / `referrerPolicy` 配置项；PDF 的 `<embed>` 路径移除（embed 无法建立 sandbox 边界） |
| P1 正确性 | Core 加载令牌 + effect cleanup 失效 + `reportState` 归属校验；DOCX `AbortController` + 渲染前/后 alive 检查 + 游离容器渲染后整体替换；`sharedData` 按文件 key 清空；5 个解析型插件加 `maxFileSize` 前置门控；新增本地 HTML 白名单清洗并接入 mammoth / SheetJS |
| P2 体验/类型 | `unsupported` 落地、`progress` 契约接线、定时器清理、图片平移、PDF 缩放控件、复制降级与反馈、换文件 key 重挂载、hover 走 React state + aria、IPv6 私网判定 |

### 1.2 改动文件列表

**源码（25 个）**

- `src/components/FilePreviewPlugin/core/FilePreviewCore.tsx`（P1-1 / P2-1 / P2-2）
- `src/components/FilePreviewPlugin/plugins/withPlugins.tsx`（P1-1 / P1-3 / P2-2 / P2-7）
- `src/components/FilePreviewPlugin/plugins/types.ts`（P2-2）
- `src/components/FilePreviewPlugin/shared/sanitizeHtml.ts`（**新建**，P1-5）
- `src/components/FilePreviewPlugin/shared/ToolbarComponents.tsx`（P2-8）
- `src/components/FilePreviewPlugin/shared/fileHelpers.ts`（P2-9）
- `src/custom-plugins/PdfPreviewPlugin/create.tsx` + `doc.json`（P0-1 / P2-5）
- `src/custom-plugins/OfficePreviewPlugin/create.tsx` + `doc.json`（P0-1）
- `src/custom-plugins/DocxPreviewPlugin/create.tsx`（P1-2）
- `src/custom-plugins/MammothDocxPlugin/create.tsx`（P1-5）
- `src/custom-plugins/XlsxPreviewPlugin/create.tsx` + `doc.json`（P1-4 / P1-5）
- `src/custom-plugins/CodePreviewPlugin/create.tsx` + `doc.json`（P1-4 / P2-3）
- `src/custom-plugins/CsvPreviewPlugin/create.tsx` + `doc.json`（P1-4）
- `src/custom-plugins/ZipPreviewPlugin/create.tsx` + `doc.json`（P1-4）
- `src/custom-plugins/PptxPreviewPlugin/create.tsx` + `doc.json`（P1-4）
- `src/custom-plugins/ImagePreviewPlugin/create.tsx`（P2-4）
- `src/custom-plugins/JsonPreviewPlugin/create.tsx`（P2-6）
- `src/custom-plugins/XmlPreviewPlugin/create.tsx`（P2-6）

**测试（11 个）**

- 新增：`test/regression-p0-sandbox.test.tsx`、`regression-core-token.test.tsx`、`regression-docx-race.test.tsx`、`regression-shared-data.test.tsx`、`regression-sanitize.test.ts`、`regression-size-gate.test.tsx`、`regression-p2-misc.test.tsx`
- 更新：`test/lifecycle.test.tsx`、`test/core-state.test.tsx`（`unsupported` 语义）、`test/plugins-c-render.test.tsx`（maxBytes 用例补 `size` fixture）、`test/dist-external.test.ts`（总量预算，见「破坏性变更」）

## 二、逐项验收表

| 编号 | 级别 | 问题 | 修复方案 | 改动位置(file:line) | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| FP-P0-1 | P0 | PDF / Office 用无 sandbox 的 iframe 渲染不可信文件，同源 HTML / blob 可在宿主源执行脚本 | PDF iframe 加 `sandbox`（默认 `allow-scripts`，不含 `allow-same-origin`）与 `referrerPolicy="no-referrer"`，移除 `<embed>` 路径；Office iframe 加 `iframeSandbox` + `iframeReferrerPolicy`（默认 `no-referrer`）；两者均可配置，`sandbox: false` 仅限可信来源 | `custom-plugins/PdfPreviewPlugin/create.tsx:69-70,109-116,210-216,236-237`；`custom-plugins/OfficePreviewPlugin/create.tsx:220-221,291-294,303-305`；两份 `doc.json` 增配置项与权衡说明 | `regression-p0-sandbox.test.tsx`：<br>「PDF 默认 sandbox 不含 allow-same-origin，且是 no-referrer」<br>「PDF 允许可信来源显式关闭 sandbox（配置项可用）」<br>「Office 查看器 iframe 也带 sandbox 与 no-referrer」 | 已修复 |
| FP-P1-1 | P1 | 快速切文件时旧 `onBeforeLoad` 晚到会覆盖新文件状态 | 每次加载自增 `loadTokenRef`，每个 `await` 后比对令牌；effect cleanup 递增令牌使旧请求失效；`reportState` 增加 `sourceUrl` 归属校验，旧文件上报直接丢弃 | `core/FilePreviewCore.tsx:130-133,170-171,179,193,213-214,227-231`；`plugins/withPlugins.tsx:267-268`（镜像比较） | `regression-core-token.test.tsx`：<br>「旧文件的 onBeforeLoad 晚到，不会覆盖新文件的状态」<br>「旧文件的 reportState 被丢弃，当前文件的照常生效」 | 已修复 |
| FP-P1-2 | P1 | DOCX fetch 之后、渲染之前没有 alive 检查，旧文件渲染结果会覆盖新文件 | `AbortController` 参与 fetch；fetch 后、渲染前、渲染后各检查 `alive`；先渲染到游离 `staging` 容器，确认存活后一次性 `replaceChildren` 提交 | `custom-plugins/DocxPreviewPlugin/create.tsx:110-117,121,129-142,146,155-156` | `regression-docx-race.test.tsx`：「切到新文件后，旧文件晚到的渲染结果不会覆盖它」 | 已修复 |
| FP-P1-3 | P1 | `sharedData` 生命周期是整个组件实例，跨文件状态串味 | 渲染期按 `${url}|${name}` 计算 `fileKey`，变化时 `sharedData.clear()` + 记录新 key；同一轮插件即可读到干净的表 | `plugins/withPlugins.tsx:130,193-197` | `regression-shared-data.test.tsx`：「换文件后读不到上一个文件写进 sharedData 的值」 | 已修复 |
| FP-P1-4 | P1 | 大文件无体积门控，同步解析进主线程可达数十秒 | Code / Csv / Xlsx 默认 20MB、Zip / Pptx 默认 50MB 前置拒绝（fetch 之前按 `file.size`）；Code 的高亮阈值改用 `file.size` 字节判定，`file.size=0` 时退化为 `text.length`；全部可配 `maxFileSize: 0` 关闭；同步更新 `doc.json` config 条目 | `CodePreviewPlugin/create.tsx:216-224,269-270,509-519`；`CsvPreviewPlugin/create.tsx:111-118`；`XlsxPreviewPlugin/create.tsx:128-135`；`ZipPreviewPlugin/create.tsx:109-116`；`PptxPreviewPlugin/create.tsx:168-175` | `regression-size-gate.test.tsx`：<br>「CSV 超过 maxFileSize 时在 fetch 之前失败」<br>「Code 的高亮阈值按字节判断（file.size），不是 text.length」 | 已修复 |
| FP-P1-5 | P1 | mammoth / SheetJS 产物直接 `dangerouslySetInnerHTML`，无本地清洗 | 新增 `sanitizeHtml`：DOMParser 前先按原文剥离危险块（防解析期执行），再用标签/属性白名单（`on*` 全丢、协议白名单、data 仅限位图、外链补 `target/rel`）；Mammoth 与 Xlsx 输出全部过清洗 | `shared/sanitizeHtml.ts:194-232`；`MammothDocxPlugin/create.tsx:123`；`XlsxPreviewPlugin/create.tsx:206,284` | `regression-sanitize.test.ts`（6 例）：<br>「删除 script / iframe / svg 子树，保留正文」<br>「丢弃所有 on* 属性」<br>「javascript: 链接的 href 被移除，文字保留」<br>「外部链接保留并补 target/rel」<br>「图片保留 src，但 onerror 与 javascript: 被移除」<br>「未知标签剥壳保留子节点」 | 已修复 |
| FP-P2-1 | P2 | 类型里有 `unsupported`，Core 永不提交 | `onBeforeLoad` 返回 `false` 时 `commit({ state: "unsupported" })`，不再落 `idle` | `core/FilePreviewCore.tsx:181-186` | 更新 `lifecycle.test.tsx`「没有插件认领 → unsupported 面板，且 Core 落在 unsupported」；`core-state.test.tsx`「onBeforeLoad 返回 false 时只跑一次，不循环」 | 已修复 |
| FP-P2-2 | P2 | `PreviewProgress` 是死契约 | `PreviewStateInfo` 增加 `progress?: PreviewProgress`；插件 `reportState` 可上报，Core loading 覆盖层消费并渲染 `ProgressIndicator`；`withPlugins` 状态镜像比较纳入 progress | `plugins/types.ts:58,81-84`；`core/FilePreviewCore.tsx:303-310`；`plugins/withPlugins.tsx:267-268` | 无独立回归（纯契约接线，由类型检查与镜像比较覆盖；原有 loading 用例持续通过） | 已修复 |
| FP-P2-3 | P2 | 代码预览「已复制」定时器卸载后仍 setState | 定时器存入 `resetTimer` ref，unmount cleanup 清理；`handleCopy` 先清旧定时器再设新定时器 | `custom-plugins/CodePreviewPlugin/create.tsx:379-405` | 无独立回归：happy-dom 无稳定卸载/定时器时序，卸载后 setState 无法在此环境稳定断言；实际行为由 ref 清理代码保证 | 已修复 |
| FP-P2-4 | P2 | 图片缩放没有平移，高倍缩放只能看中心 | 偏移写入 `sharedData`（`image:offset`），指针拖拽 + 边界 clamp；`transform` 增加 `translate`，放大后 `cursor: grab`、拖拽中禁用 transition；复位同时清偏移 | `custom-plugins/ImagePreviewPlugin/create.tsx:62,87-150,180,217` | `regression-p2-misc.test.tsx`：「放大后 transform 带上 translate，光标变成可抓取」 | 已修复 |
| FP-P2-5 | P2 | PDF 缩放与翻页完全交给外部查看器，`enableToolbar:false` 时只剩下载 | 工具栏补自研缩放 −/百分比/+/↺（缩放值经 `sharedData` + iframe `style.zoom` 生效）；`enableToolbar:false` 时同样提供缩放控件并说明「翻页由浏览器查看器处理」；`doc.json` 写明边界与翻页归属 | `custom-plugins/PdfPreviewPlugin/create.tsx:109-122,138-185`；`PdfPreviewPlugin/doc.json` | `regression-p0-sandbox.test.tsx`：「PDF enableToolbar=false 时补回缩放控件（P2-5，工具栏不再只有一个下载）」 | 已修复 |
| FP-P2-6 | P2 | JSON / XML 复制走裸 `navigator.clipboard`，无降级、无反馈 | 两处改用 `copyToClipboard`（clipboard → execCommand 兜底）；增加「已复制 / 复制失败」状态与定时器（unmount 清理） | `custom-plugins/JsonPreviewPlugin/create.tsx:165-169,380-386`；`custom-plugins/XmlPreviewPlugin/create.tsx:153-157,283-287` | `regression-p2-misc.test.tsx`：「navigator.clipboard 不可用（http 内网）时退到 execCommand 并返回成功」 | 已修复 |
| FP-P2-7 | P2 | CSV 排序 / 列宽等本地 state 切文件不复位 | 工具栏与正文容器按 `fileKey` 设 `key`，换文件强制重挂载复位本地 state；与 sharedData 清空同源 | `plugins/withPlugins.tsx:289,306` | `regression-shared-data.test.tsx`：「CSV 类本地 state（排序 / 列宽）的等价状态在换文件后清零」 | 已修复 |
| FP-P2-8 | P2 | 工具栏按钮绕过 React 直接改 DOM 样式；图标按钮无 aria-label | hover 改 `useState` 驱动样式；`aria-label` 取 `title`/文字子节点，纯图标按钮 `span` 标 `aria-hidden`；空标签按钮 `aria-hidden`；`children` 改为可选（纯图标按钮） | `shared/ToolbarComponents.tsx:100-163` | `regression-p2-misc.test.tsx`：<br>「图标按钮有 aria-label，图标本身对读屏器隐藏」<br>「hover 由 React state 驱动（样式真的变了，且能还原）」 | 已修复 |
| FP-P2-9 | P2 | 私网判定只拦 IPv4 与 `::1`，IPv6 私网仍发给第三方 viewer | 新增 `isBlockedIpv6`（`fc00::/7`、`fe80::/10`、`::1`/`::`、`::ffff:` 点分与规范化十六进制映射）与 `isPrivateIpv4`；`isPubliclyReachableUrl` 统一调用 | `shared/fileHelpers.ts:80-160` | `regression-p2-misc.test.tsx`：<br>「唯一本地 / 链路本地 / IPv4 映射都被判为不可达」<br>「公网 IPv6 不被误杀」 | 已修复 |

## 三、验证记录

均在 `e:\react-plugin-component` 下真实执行：

| 命令 | 实际结果 | 退出码 |
| --- | --- | --- |
| `pnpm --filter vane-file-preview test` | `Test Files 25 passed (25)`；`Tests 283 passed (283)`；`Duration 43.97s` | 0 |
| `pnpm --filter vane-file-preview typecheck` | `tsc --noEmit -p tsconfig.json` 无输出（无类型错误） | 0 |
| `pnpm --filter vane-file-preview lint` | `81 problems (0 errors, 81 warnings)`；warning 均为既有 `react-refresh/only-export-components`（插件工厂文件）与测试里的 `no-explicit-any` | 0 |
| `pnpm --filter vane-file-preview build` | `✓ built in 7.70s`；`vite:dts` 声明文件构建完成；产物含新建 `chunks/sanitizeHtml-*.js`（3.83KB） | 0 |

补充：`test/dist-external.test.ts` 的 dist 总量闸门实测 **230.9KB**（不含桶入口），单文件均 ≤ 60KB，重依赖外部化断言全部通过。

## 四、遗留问题与风险

1. **Office 的 `allow-same-origin`**：默认 sandbox 为 `allow-scripts allow-same-origin allow-popups allow-forms`。查看器目标是固定第三方跨源域名（`view.officeapps.live.com` / `docs.google.com`），`allow-same-origin` 只还原查看器**自身** origin，不会让文件内容回到宿主源，因此保留以维持在线预览可用性。**残余风险**：若消费方把查看器地址换成同源地址，该默认组合即失效；本插件已把 `iframeSandbox` 暴露为配置项并在 `doc.json` 写明，建议同源场景显式改为 `allow-scripts allow-popups allow-forms`。
2. **PDF 默认 `allow-scripts`**：浏览器内置 PDF 查看器在部分实现里需要脚本；去掉 `allow-scripts` 更严格但可能连内置查看器都打不开。当前保留 `allow-scripts`、不给 `allow-same-origin`，既保留渲染能力又不继承宿主源。
3. **体积预算调整（破坏性变更）**：`test/dist-external.test.ts` 的 dist 总量上限由 220KB 调整为 240KB。原因是本轮安全/正确性修复把自有代码推高约 11KB；重依赖内联仍会跳一个数量级（迁移前 985.97KB），闸门语义不变。
4. **默认拒绝超大文件（行为变更）**：Code / Csv / Xlsx 默认 20MB、Zip / Pptx 默认 50MB 直接拒绝读取。之前能打开的超大文件现在会看到明确错误；需要时用 `maxFileSize: 0` 或更大值恢复。
5. **HTML 清洗是白名单而非完整 sanitizer**：标签/属性面较窄，mammoth 与 SheetJS 的常见输出已覆盖；若未来第三方库输出新的富标签（如 SVG 图表），会落到「剥壳或丢弃」，属于显示退化而非安全退化。
6. **DOMParser 前预剥离**：正则只做「多删」；极端畸形 HTML 可能被多删内容，但不会放过危险节点。该步骤同时规避 happy-dom 在解析期执行 `<script>` 的问题。
7. **P2-3 无独立回归**：卸载后定时器 setState 属时序问题，happy-dom 下无法稳定复现；已用 `useRef` + cleanup 从代码层面消除，并保留 typecheck/lint 闸门。
8. **P2-2 `progress` 未接入具体插件**：契约已可用（类型 + Core 消费），但本包插件尚未主动上报 `progress`，需要真实分片解析（如大 XLSX）时才会上报。

## 五、未覆盖范围

- 未启动真实浏览器验证 P0-1 的 payload、sandbox 对浏览器内置 PDF 查看器的实际影响、CSP `frame-src` 部署效果；本清单只验证了 DOM 属性与回归行为。
- 未做跨包集成回归（`packages/plugin-core` 不在允许修改范围，也未运行其它包的测试）。
- 未验证 mammoth / SheetJS 对真实恶意样本的端到端清洗（只覆盖构造的注入用例）。
- 未评估 Office 在线查看器在 `allow-same-origin` 被消费方移除后的具体可用性（依赖第三方域名策略）。
