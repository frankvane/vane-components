# vane-resume 实施清单（Phase 1.2）

> 配套 `tasks/59-vane-resume-分析.md`。按此推进，阶段性完成自动提交推送双远端（已授权）。
> 门禁判据见 vane-package-builder SKILL：typecheck 0 / lint 0 / 结构·配置·体积门绿 / build:demo 成功 / selftest PASS / 对比度 0 不达标。

## P1 构建

### 1.3 脚手架与命名
- [ ] `node scripts/create-component.mjs vane-resume --title "结构化简历" --desc "插件式 React 简历系统"`
- [ ] `pnpm install`（新包必须；包内 `.bin` 才有 vite/vitest/rollup）
- [ ] `node scripts/sync-exports.mjs`（`exports:{}` → 否则 check FAIL）
- [ ] 自查：`node scripts/check-structure.mjs 2>&1 | grep vane-resume` 与 `check-config` 有输出

### 1.6 核心实现与入口聚合
- [ ] `src/components/ResumePlugin/plugins/types.ts`：ResumeCoreProps/Ref、ResumePluginContext（扩展 activeTab→sectionOrder/highlightKeywords/collapsed/template/lang/theme/privacyOn…）、ResumePluginHooks（内核 9 + 领域槽 renderToolbar/renderBasics/renderWork/renderEducation/renderSkills/renderProjects/renderExtra/renderAttachments/renderFooter，及两类槽标注）、ResumeSlotName
- [ ] `src/components/ResumePlugin/plugins/slots.tsx`：`useResumeSlot`（装饰累积）/ `renderResumeSlot`（内容覆盖取最高 priority，否则核心默认）+ `useResumeContext`
- [ ] `src/components/ResumePlugin/ResumeCore.tsx`：A4 分段布局，按 `state.sectionOrder` 输出板块；头部统一绘制（支持 SectionCollapse 折叠）；`forwardRef` + `useImperativeHandle`（getContainer/forceUpdate/getSize/getSectionOrder）；`containerRefExternal`；核心默认渲染 work/education/skills/projects/extra/basics；文本统一走 `highlight(text,ctx)` 辅助（KeywordHighlight 生效点）
- [ ] `src/withResumePlugins.tsx`：领域 HOC，**只兜 renderOverlay，绝不过内核 composeSlots**（同名槽撞车→重影铁律）；工厂 `createResumeSelector` 模块顶层调用
- [ ] `src/entries/core.ts`（核心）、`src/entries/plugins.ts`（插件全家桶）、`src/index.ts`（只聚合 Core + withResumePlugins + 类型，不桶导出插件）
- [ ] `src/styles/`：`tokens.css` + `resume.css`(vc- 前缀) + `templates.css`(3 套版式) + `print.css`(@media print，PrintOptimize 协同)；`sideEffects:["**/*.css"]`；`createLibConfig` 产出 `dist/style.css`

### 1.7 插件三件套（20 个，全在 `src/custom-plugins/<Name>Plugin/`）
每个：① `create.tsx`（含 JSX，hooks 纯净、禁 React hooks；工厂模块顶层调用；`.meta = doc`）；② `doc.json`（name/description/since/tags/config[]/example/examples 双字段）；③ `index.ts`。
命名与 priority 区间严格按 59 文第 4 节表。新增后固定两跑：`sync-exports.mjs` + `generate-plugin-docs.mjs`（后者跑完 `git status` 回滚无关包）。

- [ ] 已规划 9 个：TemplateSwitch / PrivacyMask / AiPolish / ExportPdf / MultiLang / Versioning / DeliverTrack / AttachmentPreview / ContactDesensitize
- [ ] 补充 11 个：PrintOptimize / SectionReorder / ThemeCustomize / ShareLink / QrCode / TimelineView / KeywordHighlight / AtsScore / StatSummary / SectionCollapse / SignatureStamp
- [ ] 关键实现要点：Dynamic import `qrcode`/`jspdf`/`html2canvas`（独立 chunk）；AiPolish 经 `config.polish` 注入（无硬编码密钥）；ShareLink 经 `config.onBuildUrl`；ContactDesensitize 默认脱敏器可配；事件钩子改闭包态必 `ctx.forceUpdate()`；内容覆盖槽 TimelineView 返回 null 交核心默认；KeywordHighlight/SectionCollapse 走 state 不抢槽

### P1 门禁（`cd packages/vane-resume`）
- [ ] `./node_modules/.bin/tsc --noEmit -p tsconfig.json` 0 错
- [ ] `../../node_modules/.bin/eslint .` 0 error
- [ ] `./node_modules/.bin/vite build --mode lib` 成功
- [ ] 仓库根 `node scripts/check-packages.mjs` 绿（**先 build 再 check**，体积门只在 dist/index.js 存在时量）

## P2 DEMO

- [ ] `demo/src/demo.config.tsx`：pkg/brand/subtitle/nav[] 三项（总览 + 插件工坊 + 场景示例）/routes[]/demos；`vane.demo` 五项与 config 一致
- [ ] `demos/` 逐项示例层：`import.meta.glob("./[0-9]*.tsx",{eager:true})` + `?raw` 同源；每页 `meta` + Stage（`useMemo` 依赖开关重建，禁渲染体内调工厂）
- [ ] 数据：`data/plugins.ts` = glob doc.json + glob create.tsx 提 priority + DEFS
- [ ] 三页套：HomePage（插件/示例数）+ PluginsPage（目录卡）+ ScenariosPage（≥2 个 ScenarioCard 真装配）
- [ ] `demo/vite.config.ts`：alias 通配在前裸名在后；`createDemoConfig({root,port,outDir:"demo-dist",open:"/demo/index.html"})`
- [ ] `App.css` 只改 --accent 四行 + 品牌文案
- [ ] 自测 `lib/selftest.tsx`（`?selftest=1`→`document.title=SELFTEST PASS n/n`）+ `lib/audit-*.ts` 几何体检（happy-dom rect 恒 0 守卫）
- [ ] 对比度体检：`build-demos` → `serve-demo.cjs demos 3350` → `/_audit.html?pkg=vane-resume` → 该包 0 处不达标

### P2 门禁
- [ ] `pnpm build:demo` 成功
- [ ] 访问 `/vane-resume/`（带尾斜杠）→ `?selftest=1` 读到 `PASS n/n`
- [ ] 对比度 0 不达标

## P3 文档·测试·门禁·发布

- [ ] `docs/components/vane-resume/{index,api,recipes}.md` ✍️ + `plugins.md` 保留 AUTO-GENERATED 标记
- [ ] `generate-plugin-docs.mjs` → `sync-readme.mjs`（README 首屏含 `npm install vane-resume`）；子路径命中 exports
- [ ] `cd packages/vane-resume && ./node_modules/.bin/vitest run`：工厂结构 / withResumePlugins 装配 onMount 进 DOM / 插件抛错沙箱隔离
- [ ] `pnpm verify` 全绿；`check-structure --strict` 无 FAIL；`sync-demo-shell --check` 无 drift
- [ ] `build-demos` → `serve-demo` → `/vane-resume/` 可访问；双远端 `git push origin main` + `git push github main`，`git ls-remote` 核 HEAD 一致
- [ ] 发布门禁（**须用户显式确认**）：changeset → `workspace:*` 临时改 `*` → `npm publish --registry https://registry.npmjs.org --access public --no-git-checks` → `git checkout -- package.json` → registry API 复核版本与 latest

## 已知限制 / 风险
- 20 插件并行实现体量大，建议按「核心 + 9 已规划 → 11 补充 → demo → 文档」分阶段提交，每阶段跑门禁
- 体积门：根入口若因模板/主题/工具膨胀超 30KB，优先 dynamic import 与子路径拆分，必要时写 `sizeBudgetNote`
- ShareLink 无宿主时数据编码进 hash 有隐私暴露，文档须提示配合 ContactDesensitize
