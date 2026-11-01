# 修复批次对 demo 示例的影响评估与同步方案（Spec）

> 范围：2026-11-01 修复批次涉及的 9 个组件（card / comment / coupon / file-preview / lazy-image / profile / sign-in / sku / waterfall）及其 demo。
> 判定依据：各包 `tasks/45–53-*-修复实施验收清单.md` 的「破坏性变更 / 行为变更 / 兼容性」章节 + 各包 `demo/src` 实际用法。
> 目标：只改「修复后 demo 展示或文案会与实际行为不符」的示例；不改逻辑，不新增能力。

## 一、逐包评估结论

| 包 | 是否受影响 | 依据（关键证据） | 处理 |
| --- | --- | --- | --- |
| vane-card | 否 | demo 券均未写 `discountType`，缺省按 `amount`（历史语义），比例券新语义不触发（`demo/src/data/plugins.ts:116-120` 等）；SKU 数据均显式带 `stock`（含 `stock:0`），「未知库存不显示售罄」不触发；画廊图片为 data-URI SVG，不触发 `errorFallbackSrc` 兜底 | 不改 |
| vane-comment | 否 | 验收清单 §6 明确「无破坏性变更；新增配置均为可选扩参」；`demo/src/lib/selftest.tsx` 由 `test/selftest.dom.test.tsx` 在 vitest 中执行且通过 | 不改 |
| vane-coupon | 否 | 新增相位 `quota-limited` 仅在装载 `EligibilityPlugin` 时出现，demo 与 selftest 未装该插件；demo 相相位图例未做穷举映射（typecheck 已通过） | 不改 |
| vane-file-preview | **是** | ① `PdfPreviewPlugin` 已移除 `<embed>` 渲染路径，`useIframe` 仅兼容保留（`src/custom-plugins/PdfPreviewPlugin/create.tsx:52-57`），但 demo 仍有 `pdf:embed` 变体与文案（`demo/src/data/plugin-catalog.ts:153-156`、`demo/src/lib/previews.tsx:139`）；② PDF iframe 默认 `sandbox="allow-scripts"`（无 `allow-same-origin`），插件文档自述 Chromium 系可能灰底空白（同文件 :22-34）。demo 的 PDF 样本是本站静态目录相对路径 `/samples/*.pdf`（`demo/src/data/samples.ts:25`），属可信来源，需要按插件文档给出的迁移方式显式关闭 sandbox | 修改 demo |
| vane-lazy-image | 否（仅视觉尺寸由插件决定） | `sanitizeSvg` 只删除 script/iframe/object/embed/foreignObject/base/meta/link/style（`src/custom-plugins/SvgPlaceholderPlugin/create.tsx:26-36`），demo 占位 SVG 的 `<defs>/<linearGradient>/<stop>/<animate>/<text>` 全部保留；且 `svgContent` 均为完整 `<svg>`（`demo/src/combos/ComboVisualEffectsPlusDemo.tsx:18-25`、`demo/src/scenarios/specs/b8-format-webp.tsx:30-32`），符合迁移要求。默认 `rootMargin` / `unobserveOnVisible` 变化：demo 关键场景已显式传 `rootMargin`（`PluginPreview.tsx:147-148`、Virtual* 与各 spec 场景），未显式处仅提前加载，不改变演示语义 | 不改 |
| vane-profile | 是（仅文案） | FollowEcho `mutual` 点击语义由 `mutual → following` 改为 `mutual → none`（`tasks/50` §2.1），demo 的 `05-followecho.tsx` 初始态可选 `mutual`，但 `meta.plugs.why` 只说明「关系变 mutual 时触发 onMutual」，未说明点「互相关注」会取消关注；QRShare demo 显式传 `url`（`13-qrshare.tsx:41-48`），不受新默认路径影响 | 只补 demo 文案 |
| vane-sign-in | 否 | 补签语义与 `demo/src/lib/selftest.tsx:119-182` 的断言一致（点击目标为「最早且不晚于业务日」），selftest 在 vitest 中通过 | 不改 |
| vane-sku | 否 | 价格统一两位小数属展示变化；demo selftest 只断言包含 `"199"` / `"299"`（`demo/src/lib/selftest.tsx:125-133`），已通过；键盘用例已在 `selftest.tsx:217-231` 按「方向键移焦点、点击才选中」更新 | 不改 |
| vane-waterfall | 否 | demo 的 `GapPlugin` 未配 `sm/md` 断点（`demo/src/data/plugins.ts:117-152`），按容器宽度的变化不触发；`FixedHeightPlugin` 显式 `itemHeight:180`，`minItemHeight` 默认 48 不生效；A11y 各 demo 均 `enableTabIndex:false`，roving 焦点不生效；`03-commerce.tsx` / `07-news-search.tsx` 的 `pageIndex` 由过滤后总数计算，页码越界钳制只会消除空列表，不改变演示预期 | 不改 |

## 二、需要修改的 demo（精确到文件与行为）

### 2.1 vane-file-preview

1. `packages/vane-file-preview/demo/src/data/plugin-catalog.ts`
   - 删除 `variants` 中的 `{ key: "pdf:embed", label: "改用 <embed>", hint: ... }`（约 :155）。
   - 更新 `note`（:158）：说明 PDF iframe 默认 `sandbox="allow-scripts"`（不含 `allow-same-origin`），以及本页样本为本站静态目录可信文件、因此 demo 显式 `sandbox: false` 以保证内置查看器可见；不可信文件保持默认。
   - 可选：把 `variants` 增加一项 `{ key: "pdf:sandbox", label: "默认 sandbox（安全默认）", hint: "不可信文件应保持默认；部分 Chromium 可能灰底" }`，用于仍能演示安全默认。**决策：保留该变体**，避免安全默认在 demo 中完全不可见。
2. `packages/vane-file-preview/demo/src/lib/previews.tsx`
   - `pdf` 条目（:138）改为 `createPdfPreviewPlugin({ sandbox: false })`，并在上方注释说明「demo 样本为本站静态可信 PDF，因此关闭 sandbox；真实不可信文件保持默认」。
   - 删除 `"pdf:embed"` 条目（:139）。
   - 新增 `"pdf:sandbox"` 条目：`createPdfPreviewPlugin()`（保持默认安全策略）。
3. `packages/vane-file-preview/demo/src/scenarios/02-mail-attachments.tsx`
   - `createPdfPreviewPlugin()`（:27）改为 `createPdfPreviewPlugin({ sandbox: false })`；`meta.plugs` 的 `why` 增补「样本为本站可信静态文件，显式关闭 sandbox 以保证查看器渲染；真实附件应保持默认」。
4. `packages/vane-file-preview/demo/src/scenarios/03-doc-approval.tsx`
   - `createPdfPreviewPlugin()`（:18）改为 `createPdfPreviewPlugin({ sandbox: false })`；`meta.plugs` 的 `why` 同步补一句可信来源说明。
5. 不改 `OfficePreviewPlugin` 相关 demo：其默认 sandbox 面向固定的第三方查看器域名（含 `allow-same-origin`），且本页样本为本地路径，本就稳定落到 `UnreachablePanel`（`plugin-catalog.ts:173`），行为未变。

### 2.2 vane-profile

1. `packages/vane-profile/demo/src/demos/05-followecho.tsx`
   - 为 `meta.plugs[0].why` 补一句：「`mutual` 状态下点击即取消关注（目标态 `none`），由宿主回写 `followState`」。
   - 可选补 `meta.note`：「按钮是受控展示：点击只触发 `onFollow`，真实关系以 `props.followState` 为准；互相关注点一次会变为未关注」。

### 2.3 其余包

card / comment / coupon / lazy-image / sign-in / sku / waterfall：**不做任何 demo 改动**（理由见第一节）。

## 三、验证方案

按包执行（真实命令，工作目录 `e:\react-plugin-component`）：

1. `pnpm --filter vane-file-preview typecheck && pnpm --filter vane-file-preview lint && pnpm --filter vane-file-preview test && pnpm --filter vane-file-preview build`
2. `pnpm --filter vane-profile typecheck && pnpm --filter vane-profile lint && pnpm --filter vane-profile test && pnpm --filter vane-profile build`
3. `pnpm check:demo`（demo 门禁：demo 源码类型/构建约束）
4. `pnpm verify`（全量 lint/typecheck/test/check/check:structure/check:config/check:demo）
5. 浏览器人工/自动化确认（可选但建议）：
   - 起 `vane-file-preview` demo，断言 PDF 默认页能显示内容、`pdf:sandbox` 页仍走 iframe 且带 `sandbox` 属性、`pdf:embed` 入口不再存在。
   - 打开 `vane-profile` 05 页，`mutual` 初始态点击后日志输出 `none`，文案与行为一致。

验收标准：
- 上述命令全部 exit 0；
- 全仓无新增体积超限（`check` 全绿）；
- demo 中不再出现 `<embed>` 文案/入口；
- 未改动任何组件源码（只动 demo 文件）。

## 四、提交与推送

沿用既有流程：每个包一个 commit，`origin` 与 `github` 双推（`origin` 已配两个 push URL）。

- commit 1：`chore(file-preview): 同步 demo 到 sandbox/无 embed 的新行为`
- commit 2：`chore(profile): 同步 FollowEcho mutual 点击语义文案`

## 五、明确不做

- 不修改 `packages/plugin-core` 或任何包 `src/`。
- 不为 demo 新增插件场景（如 coupon 的 EligibilityPlugin）。
- 不改 demo 的样本数据、样式体系或页面结构。
- 不做视觉回归基线（无基线设施），仅做行为与文案一致性确认。

## 六、需用户批准的点

1. 是否可以按上述方案修改 file-preview demo（删除 `pdf:embed`、主 PDF 预览改 `sandbox:false`、新增 `pdf:sandbox` 变体）。
2. 是否同意 profile demo 只补文案、不改交互。
3. 修改完成后是否按「每包一 commit + origin/github 双推」提交。
